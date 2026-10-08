import json
import csv
import os

def write_json_report(report, output_path):
    with open(output_path, "w") as f:
        json.dump(report, f, indent=4)

def safe_cell(val):
    val_str = str(val)
    if val_str and val_str[0] in "=+-@":
        return "'" + val_str
    return val

def write_csv_report(report, output_path):
    with open(output_path, "w", newline='') as f:
        writer = csv.writer(f)
        writer.writerow([safe_cell(x) for x in ["Class", "Total Images", "Formats", "Dimensions"]])
        for cls, data in report.get("classes", {}).items():
            formats = json.dumps(data.get("formats", {}))
            dimensions = json.dumps(data.get("dimensions", {}))
            writer.writerow([safe_cell(x) for x in [cls, data.get("total_images", 0), formats, dimensions]])

def generate_reports(report, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    write_json_report(report, os.path.join(output_dir, "report.json"))
    write_csv_report(report, os.path.join(output_dir, "report.csv"))
