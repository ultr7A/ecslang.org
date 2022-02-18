export const muchAttrManyTimeWow = (elem, args) => {
    for (const a in args) {
        const arg = args[a];

        elem.setAttribute(arg[0], arg[1]);
    }
}