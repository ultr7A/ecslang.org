export default class URLUtil {
    buffer = [];

    /**
     * parse url like https://ecslang.org?p=0&c=";$preview($cursor:$any$)${;$let$components$=$this.entity.componentsByAttr;$;$if$($components$&&$components.tool$);$this.entity.componentsByAttr.tool[0].state.tool.preview.show($cursor$);$};$hidePreview($)${;$let$components$=$this.entity.componentsByAttr;$if$($components$&&$components.tool$);$components.tool[0].state.tool.preview.hide();$;$};$unequip$(hand:$n"
     */
    parseURL() {
        const search = window.location.search,
            query = search.substring(1).split("&"),
            set = {};
        
        let params = []; //[query.substr(0,idx), query.substr(idx+1, query.length-1)],

        params = query.map(pair => pair.split("="))

        for (let i = params.length -1; i > -1; i --) {
            const pair = params[i];

            set[pair[0]] = pair[1];
        }

        if (set['r'] == 0) {
            this.buffer = [];
        }

        this.buffer.push(this.decode(set['c']));
        console.log("get signal", this.buffer)
        if (set['r'] > 0) {
            return {data: this.buffer.join(""), config: {...set,  p: parseInt(set['p']) }};
        } 
        
        if (set['r'] == 0) {
            return {data: this.buffer.join(""), config: set};
        }
    }

    getNumberOfSheets(code) {
        return this.encode(code).length;
    }

    makeURL(code, sheet = 0, v, h) {
        const url = window.location.origin+"?";
        let buffer = [];

        if (code) {
            const payload = this.encode(code);
            let editorConfig = "";    
            const remain = payload.length - 1,
                c = payload[sheet];
            
            if (v !== null && v !== undefined || h !== null && h !== undefined) {
                if (v != null && v != undefined) {
                    editorConfig += "&v="+v;

                }
                if (h != null && h != undefined) {
                    editorConfig += "&h="+h;
                }
            }

            if (remain) {
                return [url+ "r="+0+editorConfig+"&c="+payload.join(""), url+ "r="+(remain)+"&c="+c]
            } else {
                return [url+ "r="+remain+editorConfig+"&c="+c];
            }
        }
        return buffer;
    }

    encode = (code) => {
        return encodeURIComponent(
                code.replace(/\n/g, ";")
                    .replace(/\;+/g, ";")
                )
                .replace(/%20/g, "$")
                .replace(/\$+/g, "$")
                .replace(/%3B/g, ";")
                .match(/.{1,600}/g);
    }

    decode = (codeData) => {
        return codeData 
            ? decodeURIComponent((typeof codeData === "string" 
                ? codeData 
                : codeData.join("")).replace(/\$/g, "%20")
              ).replace(/\$/g, " ")
               .replace(/\;/g, ";\n")
               .replace(/\}\;/g, "}")
               .replace(/\{\;/g, "{")
               
               .replace(/\}\s+\;/g, "}")
               .replace(/\{\s+\;/g, "{")
               .replace(/\,\s*\;/g, ",")
               .replace(/\s;\n+/g, "")
               .replace(/\n(!?\s+)\;(!?\s+)\n/g, "")
               .replace(/\n;\n/g, "")
               .replace(/g\;\nb/g, "g;b")
               .replace(/';\n'/g, "';'")
               .replace(/";\n"/g, '";"')
            : "";

    }
}