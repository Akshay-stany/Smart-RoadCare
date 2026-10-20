"""
Supported Class Definitions for Road Surface Damage Detection
Based on Road Damage Dataset (RDD2022 / IEEE BigData Challenge standard).
"""

RDD_CLASS_MAP = {
    0: {
        "code": "D00",
        "name": "Longitudinal Crack",
        "description": "Linear crack parallel to traffic flow",
        "category": "road_crack",
        "default_severity": "Medium",
    },
    1: {
        "code": "D10",
        "name": "Transverse Crack",
        "description": "Linear crack perpendicular to traffic flow",
        "category": "road_crack",
        "default_severity": "Medium",
    },
    2: {
        "code": "D20",
        "name": "Alligator Crack",
        "description": "Interconnected fatigue crack network",
        "category": "road_crack",
        "default_severity": "High",
    },
    3: {
        "code": "D40",
        "name": "Pothole",
        "description": "Structural bowl-shaped depression with broken asphalt edges",
        "category": "pothole",
        "default_severity": "High",
    },
    4: {
        "code": "D43",
        "name": "Faded Crosswalk / Marking",
        "description": "Worn or faded road surface marking",
        "category": "road_marking_faded",
        "default_severity": "Low",
    },
    5: {
        "code": "D44",
        "name": "Faded Lane Line",
        "description": "Worn lane boundary line",
        "category": "road_marking_faded",
        "default_severity": "Low",
    },
}
