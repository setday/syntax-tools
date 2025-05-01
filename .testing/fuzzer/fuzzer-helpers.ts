import { Cst } from '../cst/cst-parser';


export function removeSpaces(cst: Cst): Cst | null {
    if (cst.$ === "leaf") return cst.text.trim() === "" ? null : cst;
    if (cst.$ === "node") {
        const newChildren = cst.children
            .map(child => removeSpaces(child))
            .filter(child => child !== null) as Cst[];
        return { ...cst, children: newChildren };
    }
    return cst;
}

export function isEmpty(cst: Cst): boolean {
    return removeSpaces(cst) === null;
}

export function removeComments(cst: Cst): Cst {
    if (cst.$ === "leaf") return cst;
    if (cst.$ === "node") {
        const newChildren = cst.children
        .filter(child => child.$ === "node" && child.type !== "Comment" && child.type !== "DocComment")
        .map(child => removeComments(child));
        return { ...cst, children: newChildren };
    }
    return cst;
}

export function removeSpacesWithUndefined(cst: Cst | undefined): Cst | null | undefined {
  if (!cst) return undefined;
  return removeSpaces(cst);
}

export function extractComments(cst: Cst): Cst[] {
    if (cst.$ === "leaf") return [];
    if (cst.$ === "node") {
        const comments = cst.children
            .filter(child => child.$ === "node" && child.type === "Comment");
        const childrenComments = cst.children
            .filter(child => child.$ === "node" && child.type !== "Comment")
            .map(child => removeComments(child))
            .flatMap(child => extractComments(child));
        return [...comments, ...childrenComments];
    }
    return [];
}

