declare module 'ali-oss' {
  interface OSSOptions {
    region: string
    bucket: string
    accessKeyId: string
    accessKeySecret: string
    secure?: boolean
  }

  interface GetResult {
    content?: Buffer
    status?: number
  }

  interface PutResult {
    name: string
    url: string
    res: any
  }

  class OSS {
    constructor(options: OSSOptions)
    get(key: string): Promise<GetResult>
    put(key: string, data: Buffer): Promise<PutResult>
  }

  export default OSS
}
