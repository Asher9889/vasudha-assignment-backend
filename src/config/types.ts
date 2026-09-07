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
    superAdmin: {
        email: string;
        password: string;
    },
}


export default IEnvConfig;