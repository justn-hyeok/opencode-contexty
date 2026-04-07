import path from 'path';
import fs from 'fs';
import { PermissionEvaluator } from './evaluator';
import { PermissionStorage } from './storage';
import type { PermissionsFile, Preset } from './types';

const defaultPermissionsFile = (): PermissionsFile => ({
  version: 1,
  presets: [],
});

export class ACPMModule {
  private readonly storage: PermissionStorage;
  private readonly ready: Promise<void>;
  private activePreset: Preset | null = null;
  private evaluator: PermissionEvaluator = new PermissionEvaluator(null);
  private watcher: fs.FSWatcher | null = null;
  private activePresetName: string | null = null;
  private currentSessionId: string | undefined;

  constructor(baseDir: string, defaultPresetName?: string) {
    this.storage = new PermissionStorage(path.resolve(baseDir));
    this.ready = this.initialize(defaultPresetName);
  }

  setSessionId(sessionId: string): void {
    this.currentSessionId = sessionId;
    void this.loadSessionActivePreset();
  }

  clearSessionId(): void {
    this.currentSessionId = undefined;
    void this.reloadActivePreset();
  }

  private async initialize(defaultPresetName?: string): Promise<void> {
    try {
      await this.storage.ensurePermissionsFile();

      if (this.currentSessionId) {
        await this.loadSessionActivePreset();
        this.startWatching();
        return;
      }

      const permissionsFile = await this.storage.readPresets();

      const presetName = defaultPresetName
        ?? permissionsFile.activePreset
        ?? permissionsFile.presets[0]?.name;

      if (presetName) {
        await this.loadPresetInternal(presetName);
      }

      this.startWatching();
    } catch {
      this.setActivePreset(null);
    }
  }

  private startWatching(): void {
    const filePath = path.join(path.resolve(this.storage['baseDir']), '.contexty', 'permissions.json');
    try {
      this.watcher = fs.watch(filePath, () => {
        this.reloadActivePreset();
      });
    } catch {
    }
  }

  private async reloadActivePreset(): Promise<void> {
    try {
      if (this.currentSessionId) {
        await this.loadSessionActivePreset();
        return;
      }

      const permissionsFile = await this.storage.readPresets();
      const targetName = this.activePresetName
        ?? permissionsFile.activePreset
        ?? permissionsFile.presets[0]?.name;

      if (targetName) {
        const preset = permissionsFile.presets.find((entry) => entry.name === targetName) ?? null;
        this.setActivePreset(preset);
      }
    } catch {
    }
  }

  destroy(): void {
    this.watcher?.close();
    this.watcher = null;
  }

  private async ensureReady(): Promise<void> {
    await this.ready;
  }

  private setActivePreset(preset: Preset | null): void {
    this.activePreset = preset;
    this.activePresetName = preset?.name ?? null;
    this.evaluator = new PermissionEvaluator(preset);
  }

  async loadPreset(presetName: string): Promise<void> {
    await this.ensureReady();
    await this.loadPresetInternal(presetName);
  }

  private async loadPresetInternal(presetName: string): Promise<void> {
    try {
      const permissionsFile = await this.storage.readPresets();
      const preset = permissionsFile.presets.find((entry) => entry.name === presetName) ?? null;
      this.setActivePreset(preset);
    } catch {
      this.setActivePreset(null);
    }
  }

  async loadSessionActivePreset(): Promise<void> {
    try {
      if (this.currentSessionId) {
        const sessionPreset = await this.storage.readActivePreset(this.currentSessionId);
        if (sessionPreset) {
          await this.loadPresetInternal(sessionPreset);
          return;
        }
      }

      const permissionsFile = await this.storage.readPresets();
      const presetName = permissionsFile.activePreset ?? permissionsFile.presets[0]?.name;

      if (presetName) {
        await this.loadPresetInternal(presetName);
      }
    } catch {
      this.setActivePreset(null);
    }
  }

  async setActivePresetName(presetName: string): Promise<void> {
    await this.ensureReady();

    if (this.currentSessionId) {
      await this.storage.writeActivePreset(this.currentSessionId, presetName);
    }

    await this.loadPresetInternal(presetName);
  }

  getActivePreset(): Preset | null {
    return this.activePreset;
  }

  async listPresets(): Promise<Preset[]> {
    await this.ensureReady();

    try {
      const permissionsFile = await this.storage.readPresets();
      return permissionsFile.presets;
    } catch {
      return defaultPermissionsFile().presets;
    }
  }

  async createPreset(preset: Preset): Promise<void> {
    await this.ensureReady();

    const permissionsFile = await this.storage.readPresets();
    const nextPresets = permissionsFile.presets.filter((entry) => entry.name !== preset.name);
    nextPresets.push(preset);
    await this.storage.writePresets({ ...permissionsFile, presets: nextPresets });

    if (this.activePreset?.name === preset.name) {
      this.setActivePreset(preset);
    }
  }

  async updatePreset(name: string, preset: Preset): Promise<void> {
    await this.ensureReady();

    const permissionsFile = await this.storage.readPresets();
    let found = false;
    const nextPresets = permissionsFile.presets.map((entry) => {
      if (entry.name !== name) {
        return entry;
      }

      found = true;
      return preset;
    });

    if (!found) {
      nextPresets.push(preset);
    }

    await this.storage.writePresets({ ...permissionsFile, presets: nextPresets });

    if (this.activePreset?.name === name) {
      this.setActivePreset(preset);
    }
  }

  async deletePreset(name: string): Promise<void> {
    await this.ensureReady();

    const permissionsFile = await this.storage.readPresets();
    const nextPresets = permissionsFile.presets.filter((entry) => entry.name !== name);
    await this.storage.writePresets({ ...permissionsFile, presets: nextPresets });

    if (this.activePreset?.name === name) {
      this.setActivePreset(null);
    }
  }

  getEvaluator(): PermissionEvaluator {
    return this.evaluator;
  }
}
