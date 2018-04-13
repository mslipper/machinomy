export declare type Task<T> = () => Promise<T>;
export default class Mutex {
    private queue;
    private busy;
    synchronize<T>(task: Task<T>): Promise<T>;
    private dequeue();
}
