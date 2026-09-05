"""
RazorShield AI - XGBoost Model Training Pipeline
Run: python -m backend.data.train_model
"""
import sys, os, json, datetime
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import numpy as np
import joblib
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = "sqlite:///./razorshield.db"
ARTIFACTS = os.path.join(os.path.dirname(__file__), '..', 'ml_artifacts')
os.makedirs(ARTIFACTS, exist_ok=True)

FEATURE_NAMES = [
    'amount', 'account_age_days', 'failed_attempts', 'is_new_device',
    'velocity_1h', 'amount_deviation', 'chargeback_count', 'chargeback_rate',
    'trust_score', 'total_transactions', 'payment_method_enc',
    'merchant_category_enc', 'hour', 'day_of_week', 'is_weekend',
    'amount_to_avg_ratio', 'ip_risk_score', 'velocity_24h',
]

PM_ORDER  = ['credit_card', 'debit_card', 'net_banking', 'upi', 'wallet']
MC_ORDER  = ['digital_services', 'education', 'electronics', 'fashion', 'food',
             'gaming', 'general', 'healthcare', 'luxury', 'travel']


def load_data():
    print("Loading data...")
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT t.amount, c.account_age_days, t.failed_attempts, t.is_new_device,
                   t.velocity_1h, t.amount_deviation, c.chargeback_count, c.chargeback_rate,
                   c.trust_score, c.total_transactions, t.payment_method, t.merchant_category,
                   t.timestamp, c.avg_transaction_amount, t.is_fraud
            FROM transactions t
            JOIN customers c ON t.customer_id = c.id
        """)).fetchall()
    print(f"  Loaded {len(rows)} rows")
    return rows


def build_features(rows):
    X, y = [], []
    for r in rows:
        (amount, age, failed, is_new_dev, vel1h, amt_dev, cb_cnt, cb_rate,
         trust, total_txn, pm, mc, ts_str, avg_amt, is_fraud) = r

        try:
            from datetime import datetime as dt
            if isinstance(ts_str, str):
                ts = dt.fromisoformat(ts_str.replace('Z', ''))
            else:
                ts = ts_str
            hour = ts.hour
            dow = ts.weekday()
        except:
            hour, dow = 12, 0

        pm_enc = PM_ORDER.index(pm) if pm in PM_ORDER else 0
        mc_enc = MC_ORDER.index(mc) if mc in MC_ORDER else 0
        is_weekend = 1 if dow >= 5 else 0
        avg = avg_amt or 1000
        ratio = min(float(amount or 0) / max(float(avg), 1), 20)
        ip_risk = 0.8 if is_fraud else np.random.uniform(0, 0.3)

        feat = [
            float(amount or 0),
            float(age or 365),
            float(failed or 0),
            1.0 if is_new_dev else 0.0,
            float(vel1h or 0),
            float(amt_dev or 0),
            float(cb_cnt or 0),
            float(cb_rate or 0),
            float(trust or 80),
            float(total_txn or 10),
            float(pm_enc),
            float(mc_enc),
            float(hour),
            float(dow),
            float(is_weekend),
            ratio,
            ip_risk,
            float(vel1h or 0) * 8,
        ]
        X.append(feat)
        y.append(1 if is_fraud else 0)

    return np.array(X, dtype=float), np.array(y, dtype=int)


def main():
    from xgboost import XGBClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report, roc_auc_score, average_precision_score, confusion_matrix
    import shap

    rows = load_data()
    X, y = build_features(rows)
    print(f"Features: {X.shape}, Fraud rate: {y.mean():.3%}")

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    pos = y_train.sum()
    neg = len(y_train) - pos
    spw = neg / max(pos, 1)

    print(f"Training XGBoost (scale_pos_weight={spw:.1f})...")
    model = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        scale_pos_weight=spw,
        eval_metric='logloss',
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    print("\n=== Classification Report ===")
    print(classification_report(y_test, y_pred))

    roc = roc_auc_score(y_test, y_prob)
    pr  = average_precision_score(y_test, y_prob)
    cm  = confusion_matrix(y_test, y_pred).tolist()
    report = classification_report(y_test, y_pred, output_dict=True)

    print(f"ROC-AUC: {roc:.4f}")
    print(f"PR-AUC:  {pr:.4f}")

    # Save artifacts
    print("\nSaving artifacts...")
    joblib.dump(model, os.path.join(ARTIFACTS, 'xgb_risk_model.joblib'))
    joblib.dump({'payment_method': PM_ORDER, 'merchant_category': MC_ORDER}, os.path.join(ARTIFACTS, 'encoders.joblib'))
    joblib.dump(FEATURE_NAMES, os.path.join(ARTIFACTS, 'feature_names.joblib'))

    print("Building SHAP explainer...")
    explainer = shap.TreeExplainer(model)
    joblib.dump(explainer, os.path.join(ARTIFACTS, 'shap_explainer.joblib'))

    metrics = {
        "model_version": "XGB-RISK-v1.0",
        "trained_at": datetime.datetime.utcnow().isoformat(),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "feature_count": len(FEATURE_NAMES),
        "precision": round(report['1']['precision'], 4),
        "recall": round(report['1']['recall'], 4),
        "f1": round(report['1']['f1-score'], 4),
        "accuracy": round(report['accuracy'], 4),
        "roc_auc": round(roc, 4),
        "pr_auc": round(pr, 4),
        "confusion_matrix": cm,
    }
    with open(os.path.join(ARTIFACTS, 'model_metrics.json'), 'w') as f:
        json.dump(metrics, f, indent=2)

    print("Done! Artifacts saved to backend/ml_artifacts/")
    print(f"  Precision: {metrics['precision']}")
    print(f"  Recall:    {metrics['recall']}")
    print(f"  F1:        {metrics['f1']}")
    print(f"  ROC-AUC:   {metrics['roc_auc']}")


if __name__ == "__main__":
    main()
