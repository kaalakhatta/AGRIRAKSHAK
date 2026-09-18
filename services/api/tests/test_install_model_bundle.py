import importlib.util
import zipfile
from pathlib import Path

import pytest


SCRIPT = Path(__file__).parents[1] / "scripts" / "install_model_bundle.py"
SPEC = importlib.util.spec_from_file_location("install_model_bundle", SCRIPT)
assert SPEC and SPEC.loader
INSTALLER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INSTALLER)


def write_bundle(path: Path, names: set[str]) -> None:
    with zipfile.ZipFile(path, "w") as archive:
        for name in names:
            archive.writestr(name, b"test")


def test_install_copies_only_required_root_files(tmp_path) -> None:
    archive = tmp_path / "bundle.zip"
    write_bundle(archive, INSTALLER.REQUIRED_FILES | {"notes.txt"})
    target = tmp_path / "model"

    INSTALLER.install(archive, target)

    assert {path.name for path in target.iterdir()} == INSTALLER.REQUIRED_FILES


def test_install_rejects_missing_external_weights(tmp_path) -> None:
    archive = tmp_path / "bundle.zip"
    write_bundle(archive, INSTALLER.REQUIRED_FILES - {"model.onnx.data"})

    with pytest.raises(RuntimeError, match="model.onnx.data"):
        INSTALLER.install(archive, tmp_path / "model")
