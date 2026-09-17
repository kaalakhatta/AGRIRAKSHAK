import numpy as np
import pytest

from agrirakshak_api.model import BundleError, softmax, split_label


def test_split_label_supports_training_folder_convention() -> None:
    assert split_label("Tomato___Early_blight") == ("Tomato", "Early blight")


def test_split_label_keeps_unstructured_condition() -> None:
    assert split_label("Healthy") == ("Unknown crop", "Healthy")


def test_softmax_returns_probabilities() -> None:
    probabilities = softmax(np.array([1.0, 2.0, 3.0]), temperature=1.0)
    assert probabilities.sum() == pytest.approx(1.0)
    assert int(np.argmax(probabilities)) == 2


def test_softmax_rejects_invalid_temperature() -> None:
    with pytest.raises(BundleError):
        softmax(np.array([1.0, 2.0]), temperature=0)

