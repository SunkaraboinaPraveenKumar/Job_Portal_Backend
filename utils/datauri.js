import DataUriParser from "datauri/parser.js"

import path from "path";

const getDataUri = (file) => {
    if (!file || !file.originalname || !file.buffer) {
        throw new Error('File object is missing required properties.');
    }
    const parser = new DataUriParser();
    const extName = path.extname(file.originalname).slice(1); // Remove the dot
    return parser.format(extName, file.buffer);
}

export default getDataUri;