var fs = require('fs');
var htmlparser = require("htmlparser2");
var level = -1;

var output = "";

var recursiveVisit = function (dom, callback) {
    if (dom instanceof Array) {
        level++;
        for (var i = 0; i < dom.length; i++) {
            callback(dom[i], i);
            recursiveVisit(dom[i].children, callback);
        }
        level--;
    }
};

var isLastChild = function (item) {
    if (!item.parent) {
        return true;
    }
    var isLast = true;
    var parentChilds = item.parent.children;
    for (var i = item.index + 1; i < parentChilds.length; i++) {
        if (parentChilds[i].type == "text") {
            if (parentChilds[i].data.trim().length != 0) {
                isLast = false;
                break;
            }
        } else {
            isLast = false;
            break;
        }
    }
    return isLast;
};

var tagToStr = function () {
    var text = this.text;
    var attr = this.attribs;

    var childs = this.children.filter(function (ch) {
        if (ch.type == "text") {
            return ch.data.trim().length > 0;
        } else {
            return true;
        }
        return ch.type != "text";
    });

    if (attr && Object.keys(attr).length > 0) {
        var props = null;
        var clas = attr.class;
        var style = attr.style;
        delete  attr.class;
        delete  attr.style;
        if (Object.keys(attr).length > 0) {
            props = attr;
        }
        attr = {};
        if (clas) {
            attr.class = {};
            clas.split(" ").forEach(function (cls) {
                attr.class[cls] = true;
            })
        }
        if (style) {
            attr.style = JSON.parse("{" + style.split(";").map(function (s) {
                    return s.split(":").map(function (ss) {
                        return '"' + ss + '"';
                    }).join(":")
                }).join(",") + "}");
        }
        if (props) {
            attr.props = props;
        }
        attr = JSON.stringify(attr);
        if (childs.length) {
            attr += ", ";
        }
    } else {
        attr = "";
    }
    var str = "";
    str += 'h("' + this.name + '", ' + attr;
    if (childs.length) {
        str += "\n";
        str += this.ident;
        str += " [";
        str += childs.join("");
        str += "]";
    }
    str += ")";
    if (isLastChild(this) == false) {
        str += ",";
    }
    str += "\n";
    str += this.ident;
    return str;
};

var textToStr = function () {
    this.data = this.data.replace(/\r/g, "");
    this.data = this.data.replace(/\n/g, "\\\n");
    return "'" + this.data + "'";
};

var commentToStr = function () {
    return "/*" + this.data + "*/\n";
};

var handler = new htmlparser.DomHandler(function (error, dom) {

    recursiveVisit(dom, function (obj, i) {
        obj.ident = Array(level*4).join(" ");
        obj.index = i;
        if (obj.type == "tag") {
            obj.toString = tagToStr;
        } else if (obj.type == "text") {
            obj.toString = textToStr;
        } else if (obj.type == "comment") {
            obj.toString = commentToStr;
        } else {
            throw "unknown type"
        }
    });
    output = dom.toString();
});

module.exports = function (html) {
    var parser = new htmlparser.Parser(handler);
    parser.write(html);
    parser.done();
    return output;
};
