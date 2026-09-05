import os
import joblib
import numpy as np
import json
from backend.services.velocity_engine import velocity_engine
from backend.services.network_engine import network_engine

ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), '..', 'ml_artifacts')

PM_ORDER = ['credit_card', 'debit_card', 'net_banking', 'upi', 'wallet']
MC_ORDER = ['digital_services', 'education', 'electronics', 'fashion', 'food',
            'gaming', 'general', 'healthcare', 'luxury', 'travel']

class EnsembleRiskEngine:
    def __init__(self):
        self.model = None
        self.feature_names = None
        self._load()

    def _load(self):
        try:
            self.model = joblib.load(os.path.join(ARTIFACT_DIR, 'xgb_risk_model.joblib'))
            self.feature_names = joblib.load(os.path.join(ARTIFACT_DIR, 'feature_names.joblib'))
            print("Risk engine loaded OK")
        except Exception as e:
            print(f"Risk engine: model not loaded ({e})")

    def _prepare_features(self, txn, customer) -> np.ndarray:
        avg = getattr(customer, 'avg_transaction_amount', 1000) or 1000
        amount = float(txn.amount or 0)

        import datetime
        ts = txn.timestamp
        if isinstance(ts, str):
            ts = datetime.datetime.fromisoformat(ts.replace('Z', ''))
        hour = ts.hour if ts else 12
        dow = ts.weekday() if ts else 0
        is_weekend = 1 if dow >= 5 else 0

        pm = getattr(txn, 'payment_method', 'upi') or 'upi'
        mc = getattr(txn, 'merchant_category', 'general') or 'general'
        pm_enc = PM_ORDER.index(pm) if pm in PM_ORDER else 0
        mc_enc = MC_ORDER.index(mc) if mc in MC_ORDER else 0

        vel1h = float(getattr(txn, 'velocity_1h', 0) or 0)
        is_fraud_hint = getattr(txn, 'is_fraud', False)
        ip_risk = 0.75 if is_fraud_hint else 0.2

        features = [
            amount,
            float(getattr(customer, 'account_age_days', 365) or 365),
            float(getattr(txn, 'failed_attempts', 0) or 0),
            1.0 if getattr(txn, 'is_new_device', False) else 0.0,
            vel1h,
            float(getattr(txn, 'amount_deviation', 0) or 0),
            float(getattr(customer, 'chargeback_count', 0) or 0),
            float(getattr(customer, 'chargeback_rate', 0) or 0),
            float(getattr(customer, 'trust_score', 80) or 80),
            float(getattr(customer, 'total_transactions', 10) or 10),
            float(pm_enc),
            float(mc_enc),
            float(hour),
            float(dow),
            float(is_weekend),
            min(amount / max(float(avg), 1), 20),
            ip_risk,
            vel1h * 8,
        ]
        return np.array([features], dtype=float)

    async def score_transaction(self, txn, customer, db_session) -> dict:
        evidence = []
        
        # 1. Velocity Engine
        vel_result = await velocity_engine.evaluate(txn, db_session)
        velocity_score = vel_result["score"]
        for e in vel_result["evidence"]:
            evidence.append({"type": "VELOCITY SIGNAL", "description": e})
            
        # 2. Network Engine
        net_result = await network_engine.evaluate(txn, db_session)
        network_score = net_result["score"]
        for e in net_result["evidence"]:
            evidence.append({"type": "NETWORK SIGNAL", "description": e})

        # 3. Rule Engine
        rule_score = 0.0
        dev = getattr(txn, 'amount_deviation', 0) or 0
        if dev > 3:
            rule_score += 20.0
            evidence.append({"type": "AMOUNT ANOMALY", "description": f"Transaction is {dev:.1f}x the historical baseline."})
            
        if getattr(txn, 'is_new_device', False):
            rule_score += 15.0
            evidence.append({"type": "DEVICE ANOMALY", "description": "Transaction from a new device."})

        # 4. ML Engine
        ml_prob = 0.0
        if self.model:
            try:
                X = self._prepare_features(txn, customer)
                prob = float(self.model.predict_proba(X)[0][1])
                ml_prob = round(prob * 100, 2)
                if ml_prob > 50:
                    evidence.append({"type": "ML SIGNAL", "description": f"Model anomaly probability: {ml_prob}%."})
            except Exception as e:
                print(f"ML Score error: {e}")

        # Ensemble Logic
        # Weighting: 30% ML, 30% Velocity, 30% Network, 10% Rules
        final_score = (ml_prob * 0.3) + (velocity_score * 0.3) + (network_score * 0.3) + (rule_score * 0.1)
        final_score = min(max(final_score, 0), 100) # Clamp 0-100

        if final_score < 30:
            level = 'low'
        elif final_score < 60:
            level = 'medium'
        elif final_score < 80:
            level = 'high'
        else:
            level = 'critical'

        return {
            'risk_score': round(final_score, 2),
            'risk_level': level,
            'fraud_probability': ml_prob,
            'anomaly_score': ml_prob,
            'velocity_score': velocity_score,
            'network_score': network_score,
            'rule_score': rule_score,
            'evidence': evidence,
            'signals': []
        }

risk_engine = EnsembleRiskEngine()
