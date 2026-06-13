import json
import re

with open('wbs_raw.json', 'r') as f:
    raw_items = json.load(f)

end_index = raw_items.index("22.6 FHO") if "22.6 FHO" in raw_items else len(raw_items)
wbs_items = raw_items[1:end_index+1] # Skip the title

def get_level(text):
    match = re.match(r'^(\d+(?:\.\d+)*)(?:\s|\.\s)(.*)', text)
    if match:
        num = match.group(1)
        name = text
        return len(num.split('.')), num, name
    return None, None, text

tree = []
stack = [] 

for item in wbs_items:
    item = str(item).strip()
    if not item: continue
    
    level, num, name = get_level(item)
    
    node = {
        "id": num if num else name,
        "name": name,
        "children": []
    }
    
    if level is not None:
        while stack and stack[-1][0] >= level:
            stack.pop()
        
        if not stack:
            tree.append(node)
        else:
            stack[-1][1]["children"].append(node)
        
        stack.append((level, node))
    else:
        if stack:
            stack[-1][1]["children"].append(node)
        else:
            tree.append(node)

with open('frontend/src/data/wbsOptions.json', 'w') as f:
    json.dump(tree, f, indent=2)
print("Saved to frontend/src/data/wbsOptions.json")
