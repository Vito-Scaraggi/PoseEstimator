import fs from 'fs-extra'
import { randomBytes} from "crypto";

const createSecret = async () => {
    if (!await fs.exists("./secret"))
        await fs.writeFile("./secret", randomBytes(64).toString('hex'));
}

createSecret();