#!/usr/bin/env python3

import os
import json
import sys

def path_to_dict(path):
    d = {'name': os.path.basename(path)}
    if os.path.isdir(path):
        d['type'] = "directory"
        d['children'] = [path_to_dict(os.path.join(path,x)) for x in os.listdir(path)]
    else:
        d['type'] = "file"
    return d

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: {os.path.basename(sys.argv[0])} <directory>")
        sys.exit(1)
    print(json.dumps(path_to_dict(sys.argv[1]),  indent=4))
