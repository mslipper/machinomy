export declare type Task<T> = () => Promise<T>;
export default class Mutex {
    private static DEFAULT_QUEUE;
    private queues;
    private busyQueues;
    synchronize<T>(task: Task<T>): Promise<T>;
    synchronizeOn<T>(key: string, task: Task<T>): Promise<T>;
    private dequeue(queueName);
}
