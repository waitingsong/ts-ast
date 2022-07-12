import { join } from 'node:path'
import { fileURLToPath } from 'node:url'


const __dirname = join(fileURLToPath(import.meta.url), '..')
export const baseDir = join(__dirname, '..')

