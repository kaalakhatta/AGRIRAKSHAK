import argparse
import sys
from pathlib import Path
from .audit import audit_dataset
from .report import generate_reports

def main():
    parser = argparse.ArgumentParser(description="Dataset Integrity Audit CLI")
    parser.add_argument("--input", required=True, help="Input directory containing class-folder dataset")
    parser.add_argument("--output", required=True, help="Output directory for reports")
    args = parser.parse_args()
    
    try:
        input_path = Path(args.input).resolve()
        output_path = Path(args.output).resolve()
        if output_path == input_path or input_path in output_path.parents:
            raise ValueError("Reports must be outside the input dataset; input files are read-only")
        report = audit_dataset(args.input)
        generate_reports(report, args.output)
        print(f"Reports generated in {args.output}")
        if report["summary"]["corrupt_or_unsupported"]:
            print("Audit failed: corrupt or unsupported input files", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
