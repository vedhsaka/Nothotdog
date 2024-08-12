let AxiomNode;
if (typeof window === 'undefined') {
    AxiomNode = require('@axiomhq/axiom-node');
}

class Logger {
    constructor() {
        if (typeof window === 'undefined') {
            // Node.js environment
            if (process.env.AXIOM_API_TOKEN && process.env.AXIOM_DATASET) {
                try {
                    this.axiom = new AxiomNode.Client({
                        token: process.env.AXIOM_API_TOKEN,
                        // orgId is optional, remove if not needed
                        // orgId: process.env.AXIOM_ORG_ID,
                    });
                    this.dataset = process.env.AXIOM_DATASET;
                    console.log('Axiom logger initialized for Node.js');
                } catch (error) {
                    console.error('Failed to initialize Axiom logger:', error);
                    console.log('Falling back to console logging');
                }
            } else {
                console.log('Axiom credentials not found, falling back to console logging');
            }
        } else {
            // Browser environment
            console.log('Running in browser, using console logging');
        }
    }

    async log(level, message, data = {}) {
        const logEntry = {
            level,
            message,
            ...data,
            timestamp: new Date().toISOString()
        };

        if (this.axiom) {
            try {
                await this.axiom.ingest(this.dataset, [logEntry]);
            } catch (error) {
                console.error('Failed to log to Axiom:', error);
                this.consoleLog(level, message, data);
            }
        } else {
            this.consoleLog(level, message, data);
        }
    }

    consoleLog(level, message, data) {
        const logMethod = console[level] || console.log;
        logMethod(`[${level.toUpperCase()}] ${message}`, data);
    }

    info(message, data) {
        return this.log('info', message, data);
    }

    error(message, data) {
        return this.log('error', message, data);
    }

    warn(message, data) {
        return this.log('warn', message, data);
    }

    debug(message, data) {
        return this.log('debug', message, data);
    }
}

module.exports = new Logger();