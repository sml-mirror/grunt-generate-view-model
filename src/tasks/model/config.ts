export class Check {
    public folders: string[];
}

export class Config {
    public check: Check;
    public options: {
        extendLevel?: number;
    }
}
