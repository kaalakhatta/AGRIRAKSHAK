from torch import nn
from torchvision.models import MobileNet_V3_Small_Weights, mobilenet_v3_small


def build_model(num_classes: int, pretrained: bool = True, freeze_features: bool = False):
    model = mobilenet_v3_small(weights=MobileNet_V3_Small_Weights.DEFAULT if pretrained else None)
    if freeze_features:
        for parameter in model.features.parameters():
            parameter.requires_grad = False
    final_layer = model.classifier[-1]
    model.classifier[-1] = nn.Linear(final_layer.in_features, num_classes)
    return model
