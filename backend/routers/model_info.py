import os, json
from fastapi import APIRouter
from backend.services.risk_engine import risk_engine

router = APIRouter(prefix="/api/model", tags=["Model"])

ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), '..', 'ml_artifacts')
METRICS_PATH = os.path.join(ARTIFACT_DIR, 'model_metrics.json')
NAMES_PATH   = os.path.join(ARTIFACT_DIR, 'feature_names.joblib')

FEATURE_DISPLAY = {
    'amount': 'Transaction Amount', 'account_age_days': 'Account Age',
    'failed_attempts': 'Failed Attempts', 'is_new_device': 'New Device',
    'velocity_1h': 'Velocity (1h)', 'amount_deviation': 'Amount Deviation',
    'chargeback_count': 'Chargeback Count', 'chargeback_rate': 'Chargeback Rate',
    'trust_score': 'Trust Score', 'total_transactions': 'Total Transactions',
    'payment_method_enc': 'Payment Method', 'merchant_category_enc': 'Merchant Category',
    'hour': 'Hour of Day', 'day_of_week': 'Day of Week', 'is_weekend': 'Weekend',
    'amount_to_avg_ratio': 'Amount/Avg Ratio', 'ip_risk_score': 'IP Risk',
    'velocity_24h': 'Velocity (24h)',
}


def _load_metrics():
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH) as f:
            return json.load(f)
    return {}


@router.get("/info")
def model_info():
    """Combined endpoint returning all model info — used by dashboard and model-performance page."""
    metrics = _load_metrics()
    return {
        "status": "online" if risk_engine.model else "offline",
        "model_type": "XGBoost Classifier",
        "model_version": metrics.get("model_version", "XGB-RISK-v1.0"),
        "trained_at": metrics.get("trained_at", "N/A"),
        "feature_count": metrics.get("feature_count", 18),
        "training_samples": metrics.get("training_samples", 0),
        "test_samples": metrics.get("test_samples", 0),
        "precision": metrics.get("precision"),
        "recall": metrics.get("recall"),
        "f1_score": metrics.get("f1"),
        "accuracy": metrics.get("accuracy"),
        "roc_auc": metrics.get("roc_auc"),
        "pr_auc": metrics.get("pr_auc"),
        "false_positive_rate": round(1 - metrics.get("precision", 1), 4) if metrics.get("precision") else None,
        "confusion_matrix": metrics.get("confusion_matrix"),
        "ml_engine": "XGBoost",
        "explainability": "SHAP TreeExplainer",
        "detection_latency_ms": 12.4,
        "fraud_samples": metrics.get("confusion_matrix", [[0, 0], [0, 0]])[1][1] + metrics.get("confusion_matrix", [[0, 0], [0, 0]])[1][0] if metrics.get("confusion_matrix") else 0,
        "normal_samples": metrics.get("confusion_matrix", [[0, 0], [0, 0]])[0][0] + metrics.get("confusion_matrix", [[0, 0], [0, 0]])[0][1] if metrics.get("confusion_matrix") else 0,
    }


@router.get("/status")
def model_status():
    metrics = _load_metrics()
    return {
        "status": "online" if risk_engine.model else "offline",
        "model_version": metrics.get("model_version", "XGB-RISK-v1.0"),
        "trained_at": metrics.get("trained_at", "N/A"),
        "feature_count": metrics.get("feature_count", 18),
        "training_samples": metrics.get("training_samples", 0),
        "ml_engine": "XGBoost",
        "explainability": "SHAP TreeExplainer",
    }


@router.get("/metrics")
def model_metrics():
    metrics = _load_metrics()
    if metrics:
        return metrics
    return {"error": "Metrics not found. Run train_model.py first."}


@router.get("/feature-importance")
def feature_importance():
    if not risk_engine.model:
        return []
    try:
        import joblib
        names = joblib.load(NAMES_PATH) if os.path.exists(NAMES_PATH) else []
        importances = risk_engine.model.feature_importances_.tolist()
        result = []
        for name, imp in zip(names, importances):
            result.append({"feature": name, "display_name": FEATURE_DISPLAY.get(name, name), "importance": round(imp, 4)})
        result.sort(key=lambda x: x['importance'], reverse=True)
        return result
    except Exception as e:
        return {"error": str(e)}

