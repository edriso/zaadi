'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { collections } from '@/lib/content';
type Snapshot = {
  collection: string;
  item: string;
  index: number;
  zoom: number;
};
type Actions = { select: (id: string) => void; zoom: (value: number) => void };
type Tool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean };
  execute: (input: unknown) => unknown;
};
export function useWebMcp(snapshot: Snapshot, actions: Actions) {
  const current = useRef<{ snapshot: Snapshot; actions: Actions } | null>(null);
  useLayoutEffect(() => {
    current.current = { snapshot, actions };
  }, [snapshot, actions]);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context) return;
    const lifecycle = new AbortController();
    const tools: Tool[] = [
      {
        name: 'zaadi_read_current',
        description:
          'Read the current collection, card, and text-size preference. Does not record recitation.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: () => current.current?.snapshot,
      },
      {
        name: 'zaadi_open_collection',
        description:
          'Open a remembrance collection at its first card and reset this session’s repetition counts.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', enum: collections.map((value) => value.id) },
          },
          required: ['id'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (input) => {
          const id = (input as { id?: unknown })?.id;
          if (
            typeof id !== 'string' ||
            !collections.some((value) => value.id === id)
          )
            throw new Error('Unknown collection');
          flushSync(() => current.current?.actions.select(id));
          return current.current?.snapshot;
        },
      },
      {
        name: 'zaadi_set_text_size',
        description:
          'Set the reading text scale between 0.8 and 1.6. Larger text may scroll.',
        inputSchema: {
          type: 'object',
          properties: { scale: { type: 'number', minimum: 0.8, maximum: 1.6 } },
          required: ['scale'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (input) => {
          const scale = (input as { scale?: unknown })?.scale;
          if (
            typeof scale !== 'number' ||
            !Number.isFinite(scale) ||
            scale < 0.8 ||
            scale > 1.6
          )
            throw new Error('Text scale out of range');
          flushSync(() => current.current?.actions.zoom(scale));
          return current.current?.snapshot;
        },
      },
    ];
    for (const tool of tools) {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {
        /* Optional API must not affect reading. */
      }
    }
    return () => lifecycle.abort();
  }, []);
}
