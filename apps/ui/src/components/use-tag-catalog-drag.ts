"use client";

import type { EmployeeTagDefinition, TagId } from "@org-tools/types";
import { type PointerEvent as ReactPointerEvent, useLayoutEffect, useRef, useState } from "react";

type Slot = { id: TagId; top: number; height: number };
type Gesture = {
  handle: HTMLButtonElement;
  pointerId: number;
  sourceIndex: number;
  slots: Slot[];
  gap: number;
  width: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  active: boolean;
  lastFrame: number;
};

type Preview = {
  destination: number;
  id: TagId;
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  offsets: ReadonlyMap<TagId, number>;
};

/** Owns only a transient gesture; the catalog changes once, on successful release. */
export function useTagCatalogDrag({
  tags,
  visible,
  query,
  open,
  onMove,
}: {
  tags: readonly EmployeeTagDefinition[];
  visible: readonly EmployeeTagDefinition[];
  query: string;
  open: boolean;
  onMove: (source: TagId, target: TagId, placement: "before" | "after") => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const frameRef = useRef<number | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  const cancel = (restoreFocus = true) => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    setPreview(null);
    if (!gesture) return;
    if (gesture.handle.hasPointerCapture(gesture.pointerId))
      gesture.handle.releasePointerCapture(gesture.pointerId);
    if (restoreFocus && gesture.handle.isConnected) gesture.handle.focus({ preventScroll: true });
  };
  const cancelRef = useRef(cancel);
  cancelRef.current = cancel;
  useLayoutEffect(() => {
    // A replacement catalog or query invalidates the measured full-catalog insertion.
    void tags;
    void query;
    void open;
    cancelRef.current(false);
    return () => cancelRef.current(false);
  }, [tags, query, open]);
  useLayoutEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !gestureRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      cancelRef.current();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, []);

  const updatePreview = (gesture: Gesture) => {
    const list = listRef.current;
    const source = gesture.slots[gesture.sourceIndex];
    if (!list || !source) return;
    const bounds = list.getBoundingClientRect();
    const contentY = gesture.y - bounds.top + list.scrollTop;
    // Slots are measured before transforms; animated siblings cannot feed back into collision.
    const others = gesture.slots.filter((slot) => slot.id !== source.id);
    const destination = others.filter((slot) => contentY > slot.top + slot.height / 2).length;
    const ordered = [...others];
    ordered.splice(destination, 0, source);
    const offsets = new Map<TagId, number>();
    let top = gesture.slots[0]?.top ?? 0;
    let placeholderTop = top;
    for (const slot of ordered) {
      offsets.set(slot.id, top - slot.top);
      if (slot.id === source.id) placeholderTop = top;
      top += slot.height + gesture.gap;
    }
    setPreview({
      destination,
      id: source.id,
      x: gesture.x - gesture.offsetX,
      y: gesture.y - gesture.offsetY,
      width: gesture.width,
      height: source.height,
      top: placeholderTop,
      offsets,
    });
  };
  const frame = (time: number) => {
    frameRef.current = null;
    const gesture = gestureRef.current;
    const list = listRef.current;
    if (!gesture?.active || !list) return;
    const bounds = list.getBoundingClientRect();
    const edge = Math.min(48, bounds.height / 3);
    const inside =
      gesture.x >= bounds.left &&
      gesture.x <= bounds.right &&
      gesture.y >= bounds.top &&
      gesture.y <= bounds.bottom;
    const velocity = !inside
      ? 0
      : gesture.y < bounds.top + edge
        ? -Math.min(1, (bounds.top + edge - gesture.y) / edge)
        : gesture.y > bounds.bottom - edge
          ? Math.min(1, (gesture.y - bounds.bottom + edge) / edge)
          : 0;
    const elapsed = Math.min(32, gesture.lastFrame ? time - gesture.lastFrame : 16);
    gesture.lastFrame = time;
    list.scrollTop += velocity * elapsed * 0.6;
    updatePreview(gesture);
    // A short frame can round to zero pixels; only an actual boundary ends edge scrolling.
    const canScroll =
      velocity < 0
        ? list.scrollTop > 0
        : velocity > 0 && list.scrollTop < list.scrollHeight - list.clientHeight;
    if (canScroll) frameRef.current = requestAnimationFrame(frame);
  };
  const schedule = () => {
    if (frameRef.current === null) frameRef.current = requestAnimationFrame(frame);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, id: TagId) => {
    if (event.button !== 0 || !event.isPrimary || gestureRef.current) return;
    const list = listRef.current;
    if (!list) return;
    const bounds = list.getBoundingClientRect();
    const rows = [...list.querySelectorAll<HTMLElement>('[data-demo-id="tag-catalog-row"]')];
    const sourceIndex = visible.findIndex((tag) => tag.id === id);
    const sourceBounds = rows[sourceIndex]?.getBoundingClientRect();
    if (sourceIndex < 0 || !sourceBounds) return;
    const slots = rows.flatMap((row, index) => {
      const tag = visible[index];
      if (!tag) return [];
      const rect = row.getBoundingClientRect();
      return {
        id: tag.id,
        top: rect.top - bounds.top + list.scrollTop,
        height: rect.height,
      };
    });
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    gestureRef.current = {
      handle: event.currentTarget,
      pointerId: event.pointerId,
      sourceIndex,
      slots,
      gap: slots[1] && slots[0] ? slots[1].top - slots[0].top - slots[0].height : 0,
      width: sourceBounds.width,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      offsetX: event.clientX - sourceBounds.left,
      offsetY: event.clientY - sourceBounds.top,
      active: false,
      lastFrame: 0,
    };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gesture.x = event.clientX;
    gesture.y = event.clientY;
    if (!gesture.active && Math.hypot(gesture.x - gesture.startX, gesture.y - gesture.startY) >= 4)
      gesture.active = true;
    if (gesture.active) schedule();
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const gesture = gestureRef.current;
    const bounds = listRef.current?.getBoundingClientRect();
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const inside =
      bounds &&
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom;
    const source = gesture.slots[gesture.sourceIndex];
    const destination = preview?.destination ?? gesture.sourceIndex;
    const target = gesture.slots[destination];
    // Commit the last painted destination, never a new unpainted pointer-up calculation.
    cancel();
    if (gesture.active && inside && source && target && source !== target)
      onMove(source.id, target.id, destination < gesture.sourceIndex ? "before" : "after");
  };
  return {
    listRef,
    preview,
    cancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: () => cancel(),
    onLostPointerCapture: () => cancel(),
    onScroll: () => {
      if (gestureRef.current?.active) schedule();
    },
  };
}
