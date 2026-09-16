from __future__ import annotations


def confusion_matrix(targets: list[int], predictions: list[int], count: int) -> list[list[int]]:
    matrix = [[0 for _ in range(count)] for _ in range(count)]
    for target, prediction in zip(targets, predictions, strict=True):
        matrix[target][prediction] += 1
    return matrix


def classification_report(targets: list[int], predictions: list[int], labels: list[str]) -> dict:
    matrix = confusion_matrix(targets, predictions, len(labels))
    per_class, f1_values = {}, []
    for index, label in enumerate(labels):
        tp = matrix[index][index]
        fp = sum(row[index] for row in matrix) - tp
        fn = sum(matrix[index]) - tp
        support = sum(matrix[index])
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        f1_values.append(f1)
        per_class[label] = {"precision": precision, "recall": recall, "f1": f1, "support": support}
    accuracy = sum(matrix[i][i] for i in range(len(labels))) / max(1, len(targets))
    return {"accuracy": accuracy, "macro_f1": sum(f1_values) / len(f1_values), "per_class": per_class, "confusion_matrix": matrix}


def select_confidence_threshold(confidences: list[float], correct: list[bool], target_precision: float = 0.85) -> dict:
    valid = []
    for threshold in sorted(set(confidences)):
        kept = [ok for confidence, ok in zip(confidences, correct, strict=True) if confidence >= threshold]
        if kept and sum(kept) / len(kept) >= target_precision:
            valid.append((len(kept), -threshold, sum(kept) / len(kept)))
    if not valid:
        return {"threshold": 1.0, "precision": 0.0, "coverage": 0.0, "target_precision": target_precision}
    kept_count, negative_threshold, precision = max(valid)
    return {"threshold": -negative_threshold, "precision": precision, "coverage": kept_count / len(correct), "target_precision": target_precision}
