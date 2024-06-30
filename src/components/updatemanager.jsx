// src/UpdateManager.js
import axios from 'axios';

class UpdateManager {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.pendingPromises = [];
    }

    addUpdate(update) {
        const updatePromise = new Promise(async (resolve, reject) => {
            this.queue.push(() => this.processUpdate(update, resolve, reject));
            if (!this.isProcessing) {
                this.processQueue();
            }
        });
        this.pendingPromises.push(updatePromise);
        return updatePromise;
    }

    async processUpdate(update, resolve, reject) {
        try {
            const response = await axios.post(update.endpoint, update.data);
            resolve(response);
        } catch (error) {
            console.error('Update failed', error);
            reject(error);
        }
    }

    async processQueue() {
        this.isProcessing = true;
        while (this.queue.length > 0) {
            const updateTask = this.queue.shift();
            await updateTask();
        }
        this.isProcessing = false;
    }

    async waitForAllUpdates() {
        await Promise.all(this.pendingPromises);
        this.pendingPromises = []; // Reset the promises array after all are resolved
    }
}

export default new UpdateManager();
