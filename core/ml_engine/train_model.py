import os
import pandas as pd
import joblib
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score

def train():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "training_data.csv")
    model_path = os.path.join(current_dir, "model.pkl")

    if not os.path.exists(data_path):
        from .generate_data import generate_synthetic_data
        generate_synthetic_data(data_path)

    df = pd.read_csv(data_path)
    features = ["reporting_lag", "amount", "mule_hops", "dist_km", "past_cases"]
    X = df[features]
    y = df["target_cashout"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = XGBClassifier(
        n_estimators=80,
        max_depth=4,
        learning_rate=0.08,
        random_state=42,
        eval_metric='logloss'
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)
    print(f"Model Training Complete -> Accuracy: {acc:.3f}, ROC-AUC: {auc:.3f}")

    joblib.dump(model, model_path)
    print(f"XGBoost model saved as {model_path}")
    return model

if __name__ == "__main__":
    train()