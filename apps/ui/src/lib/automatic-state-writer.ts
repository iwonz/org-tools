import type { StateDocument, StatePutRequest } from "@/lib/state-runtime";

type StateWriteQueueOptions = {
  onError: (error: unknown) => void;
  onPendingChange?: (pending: boolean) => void;
  onSuccess?: (document: StateDocument, request: StatePutRequest) => void;
  write: (request: StatePutRequest) => Promise<StateDocument>;
};

export class AutomaticStateWriter {
  private active = false;
  private epoch = 0;
  private paused = false;
  private pendingAll: Extract<StatePutRequest, { scope: "all" }> | null = null;
  private pendingOrganization: Extract<StatePutRequest, { scope: "organization" }> | null = null;
  private pendingUi: Extract<StatePutRequest, { scope: "ui" }> | null = null;
  private readonly options: StateWriteQueueOptions;

  constructor(options: StateWriteQueueOptions) {
    this.options = options;
  }

  get hasPending(): boolean {
    return this.active || Boolean(this.pendingAll || this.pendingOrganization || this.pendingUi);
  }

  enqueue(request: StatePutRequest): void {
    if (request.scope === "all") {
      this.pendingAll = request;
      this.pendingOrganization = null;
      this.pendingUi = null;
    } else if (request.scope === "organization") {
      this.pendingOrganization = request;
    } else {
      this.pendingUi = request;
    }
    this.options.onPendingChange?.(true);
    if (!this.paused) void this.pump();
  }

  retry(): void {
    this.paused = false;
    void this.pump();
  }

  discardPending(): void {
    this.epoch += 1;
    this.pendingAll = null;
    this.pendingOrganization = null;
    this.pendingUi = null;
    this.paused = false;
    if (!this.active) this.options.onPendingChange?.(false);
  }

  private takeNext(): StatePutRequest | null {
    if (this.pendingAll) {
      const request = this.pendingAll;
      this.pendingAll = null;
      return request;
    }
    if (this.pendingOrganization) {
      const request = this.pendingOrganization;
      this.pendingOrganization = null;
      return request;
    }
    if (this.pendingUi) {
      const request = this.pendingUi;
      this.pendingUi = null;
      return request;
    }
    return null;
  }

  private restore(request: StatePutRequest): void {
    if (request.scope === "all" && !this.pendingAll) this.pendingAll = request;
    if (request.scope === "organization" && !this.pendingOrganization) {
      this.pendingOrganization = request;
    }
    if (request.scope === "ui" && !this.pendingUi) this.pendingUi = request;
  }

  private async pump(): Promise<void> {
    if (this.active || this.paused) return;
    const request = this.takeNext();
    if (!request) {
      this.options.onPendingChange?.(false);
      return;
    }
    this.active = true;
    const epoch = this.epoch;
    try {
      const document = await this.options.write(request);
      if (epoch === this.epoch) this.options.onSuccess?.(document, request);
    } catch (error) {
      if (epoch === this.epoch) {
        this.restore(request);
        this.paused = true;
        this.options.onError(error);
      }
    } finally {
      this.active = false;
    }
    if (!this.paused) void this.pump();
  }
}
