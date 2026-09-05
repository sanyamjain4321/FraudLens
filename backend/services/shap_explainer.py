import os
import joblib
import numpy as np

ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), '..', 'ml_artifacts')

FEATURE_DISPLAY = {
    'amount': 'Transaction Amount',
    'account_age_days': 'Account Age',
    'failed_attempts': 'Failed Attempts',
    'is_new_device': 'New Device Detected',
    'velocity_1h': 'Transaction Velocity (1h)',
    'amount_deviation': 'Amount vs Historical Average',
    'chargeback_count': 'Chargeback History Count',
    'chargeback_rate': 'Chargeback Rate',
    'trust_score': 'Customer Trust Score',
    'total_transactions': 'Total Transaction History',
    'payment_method_enc': 'Payment Method Risk',
    'merchant_category_enc': 'Merchant Category Risk',
    'hour': 'Hour of Transaction',
    'day_of_week': 'Day of Week',
    'is_weekend': 'Weekend Transaction',
    'amount_to_avg_ratio': 'Amount to Customer Average Ratio',
    'ip_risk_score': 'IP Address Risk Score',
    'velocity_24h': '24h Transaction Velocity',
}


class ShapExplainer:
    def __init__(self):
        self.explainer = None
        self.feature_names = None
        self._load()

    def _load(self):
        try:
            self.explainer = joblib.load(os.path.join(ARTIFACT_DIR, 'shap_explainer.joblib'))
            self.feature_names = joblib.load(os.path.join(ARTIFACT_DIR, 'feature_names.joblib'))
            print("SHAP explainer loaded OK")
        except Exception as e:
            print(f"SHAP: not loaded ({e})")

    def explain_transaction(self, txn, customer) -> dict:
        if not self.explainer:
            return {'features': [], 'base_value': 0.0, 'available': False}
        try:
            from backend.services.risk_engine import risk_engine
            X = risk_engine._prepare_features(txn, customer)
            shap_values = self.explainer.shap_values(X)
            if isinstance(shap_values, list):
                sv = shap_values[1][0]
            else:
                sv = shap_values[0]

            names = self.feature_names or [f'f{i}' for i in range(len(sv))]
            features = []
            for i, (name, val) in enumerate(zip(names, sv)):
                features.append({
                    'name': name,
                    'display_name': FEATURE_DISPLAY.get(name, name.replace('_', ' ').title()),
                    'shap_value': round(float(val), 4),
                    'contribution': 'positive' if val > 0 else 'negative',
                    'value': float(X[0][i]),
                })
            features.sort(key=lambda x: abs(x['shap_value']), reverse=True)

            base_value = 0.0
            if hasattr(self.explainer, 'expected_value'):
                ev = self.explainer.expected_value
                base_value = float(ev[1]) if isinstance(ev, (list, np.ndarray)) else float(ev)

            return {'features': features[:15], 'base_value': round(base_value, 4), 'available': True}
        except Exception as e:
            print(f"SHAP error: {e}")
            return {'features': [], 'base_value': 0.0, 'available': False}


shap_explainer = ShapExplainer()
