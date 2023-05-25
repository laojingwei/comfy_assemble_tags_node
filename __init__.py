import os
import folder_paths
import shutil
cwd = os.getcwd()

select_tags_path = os.path.join(cwd, "web", "extensions", "select_tags")
select_tags_path_bk = os.path.join(cwd, "custom_nodes", "comfy_assemble_tags_node", "select_tags")

if not os.path.isdir(select_tags_path):
    print("----------start------第一次使用-------未发现select_tags文件夹，正在处理。。。")
    shutil.copytree (select_tags_path_bk, select_tags_path)
    print("-----------end------------select_tags文件夹处理完成--------------")

class SELECTTAGS:
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {
            "text": ("STRING", {"multiline": True}),
        }}

    RETURN_TYPES = ("STRING",)
    FUNCTION = "tweak_keywords"
    OUTPUT_NODE = True

    CATEGORY = "xww/tags"

    def tweak_keywords(self, text):   
        return {"ui": { "text": text }, "result": (text,)}


inputTypes = {
    "required": {
        # (主题)
        "theme": ("STRING", {"default": ""}),
        # (人)
        "people": ("STRING", {"default": ""}),
        # (服装)
        "clothing": ("STRING", {"default": ""}),
        # (背景)
        "background": ("STRING", {"default": ""}),
        # (前景)
        "foreground": ("STRING", {"default": ""}),
        # (天气)
        "weather": ("STRING", {"default": ""}),
        # (其它)
        "other": ("STRING", {"default": ""}),
        # (其它1)
        "other1": ("STRING", {"default": ""}),
        # (其它2)
        "other2": ("STRING", {"default": ""}),
        # (其它3)
        "other3": ("STRING", {"default": ""}),
    }
}
try:
    embeddingsFile = folder_paths.get_filename_list("embeddings")
    embeddingsList = ['none']
    embeddingsList = embeddingsList + embeddingsFile
    emb = {
        "embeddings": (embeddingsList, ),
        "embeddingsStrength": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 10.0, "step": 0.01}),
    }
    inputTypes['required'].update(emb)
except:
    emb = {}

class ASSEMBLETAGS:
    @classmethod
    def INPUT_TYPES(s):
        return inputTypes

    RETURN_TYPES = ("STRING",)
    FUNCTION = "assemble_tags"
    OUTPUT_NODE = True

    CATEGORY = "xww/tags"

    if len(emb) > 0:
        def assemble_tags(self, theme,people,clothing,background,foreground,weather,other,other1,other2,other3,embeddings,embeddingsStrength):
            text = ",".join([x for x in [theme if theme is not None else "",
                                people if people is not None else "",
                                clothing if clothing is not None else "",
                                background if background is not None else "",
                                foreground if foreground is not None else "",
                                weather if weather is not None else "",
                                other if other is not None else "",
                                other1 if other1 is not None else "",
                                other2 if other2 is not None else "",
                                other3 if other3 is not None else "",] if x != ""])
            if  embeddings == 'none':
                return (text,)
            textEmb = '{},embeddings:{}:{},'
            textEmb = textEmb.format(text, embeddings, format(embeddingsStrength,'.3f'))
            return(textEmb,)
    else: 
        def assemble_tags(self, theme,people,clothing,background,foreground,weather,other,other1,other2,other3):
            text = ",".join([x for x in [theme if theme is not None else "",
                                people if people is not None else "",
                                clothing if clothing is not None else "",
                                background if background is not None else "",
                                foreground if foreground is not None else "",
                                weather if weather is not None else "",
                                other if other is not None else "",
                                other1 if other1 is not None else "",
                                other2 if other2 is not None else "",
                                other3 if other3 is not None else "",] if x != ""])
            return(text,)

    
class SHOWTAGS:
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {
            "text": ("STRING", {"forceInput": True}),
        }}

    RETURN_TYPES = ("STRING",)
    FUNCTION = "show_tags"
    OUTPUT_NODE = True

    CATEGORY = "xww/tags"

    def show_tags(self, text):   
        return {"ui": { "text": [text] }, "result": (text,)}
    

class SHOWSEED:
    def __init__(self):
        self.type = "output"
    @classmethod
    def INPUT_TYPES(s):
        return {"required": 
                    {"images": ("IMAGE", ),},
                "hidden": {"prompt": "PROMPT", "extra_pnginfo": "EXTRA_PNGINFO"},
                }

    RETURN_TYPES = ()
    FUNCTION = "show_seed"
    OUTPUT_NODE = True

    CATEGORY = "xww"
    def show_seed(self, images, filename_prefix="", prompt=None, extra_pnginfo=None):
        text = ''
        if prompt is not None:
            seeds = [v.get('inputs').get('seed') for v in prompt.values() if v.get('inputs').get('seed')]
            text = ",".join(map(str, seeds))
        return {"ui": { "seed": [text] }, "result": (text,)}

NODE_CLASS_MAPPINGS = {
    "Assemble Tags": ASSEMBLETAGS,
    "Select Tags": SELECTTAGS,
    "Show Tags": SHOWTAGS,
    "Show Seed": SHOWSEED,
}
