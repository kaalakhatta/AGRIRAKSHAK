import argparse
import sys
from .audit import audit_dataset
from .report import generate_reports

def main():
    parser = argparse.ArgumentParser(description="Dataset Integrity Audit CLI")
    parser.add_argument("--input", required=True, help="Input directory containing class-folder dataset")
    parser.add_argument("--output", required=True, help="Output directory for reports")
    args = parser.parse_args()
    
    try:
        report = audit_dataset(args.input)
        generate_reports(report, args.output)
        print(f"Reports generated in {args.output}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
