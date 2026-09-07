interface IEnvConfig {
    port: number;
    nodeEnv: string;  
    
    mongodbConnectionString: string;
    mongoDBConfig: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
    },
}


export default IEnvConfig;