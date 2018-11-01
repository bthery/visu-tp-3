#!/usr/bin/env python3

import os
import json
import sys

def path_to_dict(path):
    d = {'name': os.path.basename(path)}
    if os.path.isdir(path):
        d['type'] = "directory"
        #d['children'] = [path_to_dict(os.path.join(path,x)) for x in os.listdir(path)]
        d['children'] = []
        d['size'] = 0
        d['files'] = 0
        for x in os.listdir(path):
            childpath = os.path.join(path, x)
            if os.path.islink(childpath):
                continue
            elif os.path.isdir(childpath):
                d['children'].append(path_to_dict(childpath))
            else:
                d['size'] += os.path.getsize(childpath)
                d['files'] += 1
        #d['size'] = os.path.getsize(path)
    else:
        d['type'] = "file"
        d['size'] = os.path.getsize(path)
    return d

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: {os.path.basename(sys.argv[0])} <directory>")
        sys.exit(1)
    print(json.dumps(path_to_dict(sys.argv[1]),  indent=4))
