

import { htmlInterpreter } from './html';
import { cssInterpreter } from './css';
import { jsInterpreter } from './javascript';

export const CODE_LANGUAGES = [
    {
        id: "html",
        label: "HTML",
        dictionary: htmlInterpreter
    },
    {
        id: "css",
        label: "CSS",
        dictionary: cssInterpreter  
    },
    {
        id: "javascript",
        label: "JavaScript",
        dictionary: jsInterpreter
    }
]