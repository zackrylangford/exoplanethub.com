import math

EARTH_REFERENCES = {
    'pl_rade': 1.0,
    'pl_eqt': 288.0,
    'pl_bmasse': 1.0,
}

MINIMUM_COMPONENTS = 2


def compute_esi(record):
    similarities = []
    for field, earth_value in EARTH_REFERENCES.items():
        value = record.get(field)
        if _is_measured(value):
            similarities.append(1 - abs((value - earth_value) / (value + earth_value)))

    if len(similarities) < MINIMUM_COMPONENTS:
        return None

    geometric_mean = math.prod(similarities) ** (1 / len(similarities))
    return round(100 * geometric_mean)


def _is_measured(value):
    # bool is an int subclass, and the similarity kernel is undefined at x <= 0.
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False
    return math.isfinite(value) and value > 0
