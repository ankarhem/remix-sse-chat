import { EventEmitter } from 'events';

declare global {
  var events: EventEmitter;
}

global.events = global.events || new EventEmitter();

export const events = global.events;

export type MessageData = {
  username: string;
  message: string;
  timestamp: number;
};

export function dispatchMessage({ username, message }: MessageData) {
  events.emit('newMessage', { username, message });
}
