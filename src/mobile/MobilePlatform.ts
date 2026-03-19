/**
 * Mobile Platform Support System
 * Provides comprehensive mobile platform support for iOS and Android
 */

// Mobile platform types
export enum MobilePlatform {
  IOS = 'ios',
  ANDROID = 'android',
  UNKNOWN = 'unknown'
}

export enum DeviceType {
  PHONE = 'phone',
  TABLET = 'tablet',
  HYBRID = 'hybrid'
}

// Build configuration
export interface BuildConfiguration {
  platform: MobilePlatform;
  targetVersion: string;
  minVersion: string;
  bundleId: string;
  appName: string;
  version: string;
  buildNumber: string;
  signing: SigningConfiguration;
  permissions: PermissionConfiguration;
  capabilities: PlatformCapabilities;
}

export interface SigningConfiguration {
  debug: boolean;
  keystore?: string;
  password?: string;
  alias?: string;
  certificate?: string;
  provisioningProfile?: string;
}

export interface PermissionConfiguration {
  camera: boolean;
  microphone: boolean;
  storage: boolean;
  location: boolean;
  network: boolean;
  vibration: boolean;
  notifications: boolean;
  custom: string[];
}

export interface PlatformCapabilities {
  hardwareAcceleration: boolean;
  multitouch: boolean;
  accelerometer: boolean;
  gyroscope: boolean;
  magnetometer: boolean;
  gps: boolean;
  bluetooth: boolean;
  nfc: boolean;
}

// Touch input system
export interface TouchConfiguration {
  maxTouchPoints: number;
  gestureRecognition: boolean;
  multiTouchEnabled: boolean;
  touchSensitivity: number;
  tapThreshold: number;
  swipeThreshold: number;
  pinchThreshold: number;
  longPressThreshold: number;
}

export interface TouchGesture {
  type: 'tap' | 'doubleTap' | 'swipe' | 'pinch' | 'rotate' | 'longPress';
  touches: number;
  startPosition: { x: number; y: number };
  endPosition?: { x: number; y: number };
  startTime: number;
  endTime?: number;
  velocity?: { x: number; y: number };
  scale?: number;
  rotation?: number;
}

export interface TouchEvent {
  id: string;
  type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel';
  position: { x: number; y: number };
  pressure: number;
  timestamp: number;
  gesture?: TouchGesture;
}

// Mobile UI system
export interface MobileUIConfiguration {
  adaptiveLayout: boolean;
  responsiveDesign: boolean;
  touchOptimized: boolean;
  statusBar: StatusBarConfiguration;
  navigation: NavigationConfiguration;
  input: InputConfiguration;
  performance: PerformanceConfiguration;
}

export interface StatusBarConfiguration {
  visible: boolean;
  style: 'default' | 'light' | 'dark';
  backgroundColor: string;
  textColor: string;
  immersive: boolean;
  overlay: boolean;
}

export interface NavigationConfiguration {
  type: 'bottom' | 'top' | 'side' | 'floating';
  gestures: boolean;
  backButton: boolean;
  overflowMenu: boolean;
  tabBar: boolean;
  drawer: boolean;
}

export interface InputConfiguration {
  virtualKeyboard: boolean;
  autoCorrect: boolean;
  autoComplete: boolean;
  inputMethod: 'touch' | 'stylus' | 'hardware';
  hapticFeedback: boolean;
  voiceInput: boolean;
}

export interface PerformanceConfiguration {
  targetFPS: number;
  adaptiveQuality: boolean;
  batteryOptimization: boolean;
  thermalThrottling: boolean;
  memoryLimit: number;
  textureCompression: boolean;
  shaderOptimization: boolean;
}

// Performance optimization
export interface OptimizationProfile {
  deviceClass: 'low' | 'medium' | 'high';
  resolutionScale: number;
  textureQuality: 'low' | 'medium' | 'high';
  shadowQuality: 'low' | 'medium' | 'high';
  particleCount: number;
  drawDistance: number;
  lodBias: number;
  antiAliasing: boolean;
  postProcessing: boolean;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  batteryLevel: number;
  thermalState: 'normal' | 'warm' | 'hot';
  networkQuality: 'poor' | 'fair' | 'good' | 'excellent';
  cpuUsage: number;
  gpuUsage: number;
}

// Mobile-specific features
export interface MobileFeatures {
  vibration: VibrationSystem;
  notifications: NotificationSystem;
  sharing: SharingSystem;
  camera: CameraSystem;
  accelerometer: AccelerometerSystem;
  gyroscope: GyroscopeSystem;
  gps: GPSSystem;
  bluetooth: BluetoothSystem;
}

export interface VibrationSystem {
  enabled: boolean;
  patterns: VibrationPattern[];
  hapticFeedback: boolean;
  intensity: number;
}

export interface VibrationPattern {
  name: string;
  duration: number;
  pattern: number[];
  intensity: number;
}

export interface NotificationSystem {
  enabled: boolean;
  local: boolean;
  push: boolean;
  permissions: boolean;
  channels: NotificationChannel[];
}

export interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  importance: 'low' | 'default' | 'high';
  sound: string;
  vibration: boolean;
}

export interface SharingSystem {
  enabled: boolean;
  platforms: SharingPlatform[];
  formats: SharingFormat[];
}

export interface SharingPlatform {
  name: string;
  package: string;
  supported: boolean;
}

export interface SharingFormat {
  type: 'text' | 'image' | 'video' | 'file' | 'url';
  mimeTypes: string[];
}

export interface CameraSystem {
  enabled: boolean;
  permissions: boolean;
  front: boolean;
  back: boolean;
  flash: boolean;
  focus: boolean;
  resolution: { width: number; height: number };
}

export interface AccelerometerSystem {
  enabled: boolean;
  frequency: number;
  smoothing: boolean;
  threshold: number;
}

export interface GyroscopeSystem {
  enabled: boolean;
  frequency: number;
  smoothing: boolean;
  threshold: number;
}

export interface GPSSystem {
  enabled: boolean;
  permissions: boolean;
  accuracy: 'low' | 'medium' | 'high';
  updateInterval: number;
  distanceFilter: number;
}

export interface BluetoothSystem {
  enabled: boolean;
  permissions: boolean;
  scanning: boolean;
  advertising: boolean;
}

// Testing framework
export interface MobileTestConfiguration {
  automated: boolean;
  deviceTesting: boolean;
  emulatorTesting: boolean;
  performanceTesting: boolean;
  compatibilityTesting: boolean;
  accessibilityTesting: boolean;
  batteryTesting: boolean;
  networkTesting: boolean;
}

export interface TestDevice {
  id: string;
  name: string;
  platform: MobilePlatform;
  version: string;
  deviceType: DeviceType;
  screenSize: { width: number; height: number };
  density: number;
  memory: number;
  cpu: string;
  gpu: string;
  available: boolean;
}

export interface TestSuite {
  name: string;
  devices: TestDevice[];
  tests: MobileTestCase[];
  parallel: boolean;
  timeout: number;
  retries: number;
}

export interface MobileTestCase {
  id: string;
  name: string;
  description: string;
  type: 'unit' | 'integration' | 'ui' | 'performance' | 'compatibility';
  steps: TestStep[];
  expected: TestExpectation;
  timeout: number;
}

export interface TestStep {
  action: string;
  parameters: Record<string, any>;
  wait?: number;
  screenshot?: boolean;
}

export interface TestExpectation {
  result: any;
  performance?: PerformanceMetrics;
  screenshot?: string;
}

// App store integration
export interface StoreConfiguration {
  platform: 'apple' | 'google' | 'amazon' | 'samsung';
  developerAccount: string;
  appId: string;
  apiKey?: string;
  secretKey?: string;
  metadata: StoreMetadata;
  assets: StoreAssets;
  pricing: StorePricing;
  distribution: StoreDistribution;
}

export interface StoreMetadata {
  title: string;
  description: string;
  shortDescription: string;
  keywords: string[];
  category: string;
  subcategory: string;
  contentRating: string;
  privacyPolicy: string;
  supportUrl: string;
  website: string;
}

export interface StoreAssets {
  icon: string[];
  screenshots: string[];
  featureGraphic: string;
  promoGraphic: string;
  video: string;
}

export interface StorePricing {
  model: 'free' | 'paid' | 'freemium' | 'subscription';
  price?: number;
  currency?: string;
  trialDays?: number;
  subscriptionPeriod?: 'weekly' | 'monthly' | 'yearly';
}

export interface StoreDistribution {
  countries: string[];
  releaseDate: Date;
  stagedRollout: boolean;
  rolloutPercentage: number;
  automaticUpdates: boolean;
}

// Main mobile platform system
export class MobilePlatformSystem {
  private platform: MobilePlatform;
  private deviceType: DeviceType;
  private buildConfig: BuildConfiguration;
  private touchConfig: TouchConfiguration;
  private uiConfig: MobileUIConfiguration;
  private features: MobileFeatures;
  private testConfig: MobileTestConfiguration;
  private storeConfigs: StoreConfiguration[];
  private optimizationProfile: OptimizationProfile;
  private performanceMetrics: PerformanceMetrics;

  constructor() {
    this.platform = this.detectPlatform();
    this.deviceType = this.detectDeviceType();
    this.buildConfig = this.createDefaultBuildConfig();
    this.touchConfig = this.createDefaultTouchConfig();
    this.uiConfig = this.createDefaultUIConfig();
    this.features = this.createDefaultFeatures();
    this.testConfig = this.createDefaultTestConfig();
    this.storeConfigs = [];
    this.optimizationProfile = this.createOptimizationProfile();
    this.performanceMetrics = this.createDefaultMetrics();
  }

  /**
   * Detect current mobile platform
   */
  private detectPlatform(): MobilePlatform {
    if (typeof navigator === 'undefined') return MobilePlatform.UNKNOWN;
    
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
      return MobilePlatform.IOS;
    } else if (userAgent.includes('android')) {
      return MobilePlatform.ANDROID;
    }
    
    return MobilePlatform.UNKNOWN;
  }

  /**
   * Detect device type
   */
  private detectDeviceType(): DeviceType {
    if (typeof navigator === 'undefined') return DeviceType.PHONE;
    
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const minDimension = Math.min(screenWidth, screenHeight);
    
    if (userAgent.includes('tablet') || minDimension >= 768) {
      return DeviceType.TABLET;
    } else if (minDimension >= 600) {
      return DeviceType.HYBRID;
    }
    
    return DeviceType.PHONE;
  }

  /**
   * Create default build configuration
   */
  private createDefaultBuildConfig(): BuildConfiguration {
    return {
      platform: this.platform,
      targetVersion: '1.0.0',
      minVersion: '1.0.0',
      bundleId: 'com.proceduralpixel.mobile',
      appName: 'Procedural Pixel Engine',
      version: '1.0.0',
      buildNumber: '1',
      signing: {
        debug: true
      },
      permissions: {
        camera: false,
        microphone: false,
        storage: true,
        location: false,
        network: true,
        vibration: true,
        notifications: false,
        custom: []
      },
      capabilities: {
        hardwareAcceleration: true,
        multitouch: true,
        accelerometer: true,
        gyroscope: true,
        magnetometer: true,
        gps: false,
        bluetooth: false,
        nfc: false
      }
    };
  }

  /**
   * Create default touch configuration
   */
  private createDefaultTouchConfig(): TouchConfiguration {
    return {
      maxTouchPoints: 10,
      gestureRecognition: true,
      multiTouchEnabled: true,
      touchSensitivity: 1.0,
      tapThreshold: 50,
      swipeThreshold: 100,
      pinchThreshold: 20,
      longPressThreshold: 500
    };
  }

  /**
   * Create default UI configuration
   */
  private createDefaultUIConfig(): MobileUIConfiguration {
    return {
      adaptiveLayout: true,
      responsiveDesign: true,
      touchOptimized: true,
      statusBar: {
        visible: true,
        style: 'default',
        backgroundColor: '#000000',
        textColor: '#ffffff',
        immersive: false,
        overlay: false
      },
      navigation: {
        type: 'bottom',
        gestures: true,
        backButton: true,
        overflowMenu: true,
        tabBar: true,
        drawer: false
      },
      input: {
        virtualKeyboard: true,
        autoCorrect: true,
        autoComplete: true,
        inputMethod: 'touch',
        hapticFeedback: true,
        voiceInput: false
      },
      performance: {
        targetFPS: 60,
        adaptiveQuality: true,
        batteryOptimization: true,
        thermalThrottling: true,
        memoryLimit: 512,
        textureCompression: true,
        shaderOptimization: true
      }
    };
  }

  /**
   * Create default mobile features
   */
  private createDefaultFeatures(): MobileFeatures {
    return {
      vibration: {
        enabled: true,
        patterns: [
          { name: 'short', duration: 100, pattern: [100], intensity: 0.5 },
          { name: 'long', duration: 500, pattern: [500], intensity: 0.8 },
          { name: 'double', duration: 200, pattern: [100, 50, 100], intensity: 0.6 }
        ],
        hapticFeedback: true,
        intensity: 0.7
      },
      notifications: {
        enabled: false,
        local: false,
        push: false,
        permissions: false,
        channels: []
      },
      sharing: {
        enabled: true,
        platforms: [
          { name: 'Facebook', package: 'com.facebook.katana', supported: false },
          { name: 'Twitter', package: 'com.twitter.android', supported: false },
          { name: 'WhatsApp', package: 'com.whatsapp', supported: false }
        ],
        formats: [
          { type: 'text', mimeTypes: ['text/plain'] },
          { type: 'image', mimeTypes: ['image/jpeg', 'image/png'] },
          { type: 'url', mimeTypes: ['text/plain'] }
        ]
      },
      camera: {
        enabled: false,
        permissions: false,
        front: false,
        back: false,
        flash: false,
        focus: false,
        resolution: { width: 1920, height: 1080 }
      },
      accelerometer: {
        enabled: false,
        frequency: 60,
        smoothing: true,
        threshold: 0.1
      },
      gyroscope: {
        enabled: false,
        frequency: 60,
        smoothing: true,
        threshold: 0.1
      },
      gps: {
        enabled: false,
        permissions: false,
        accuracy: 'medium',
        updateInterval: 1000,
        distanceFilter: 10
      },
      bluetooth: {
        enabled: false,
        permissions: false,
        scanning: false,
        advertising: false
      }
    };
  }

  /**
   * Create default test configuration
   */
  private createDefaultTestConfig(): MobileTestConfiguration {
    return {
      automated: true,
      deviceTesting: true,
      emulatorTesting: true,
      performanceTesting: true,
      compatibilityTesting: true,
      accessibilityTesting: true,
      batteryTesting: true,
      networkTesting: true
    };
  }

  /**
   * Create optimization profile for current device
   */
  private createOptimizationProfile(): OptimizationProfile {
    const memory = this.getDeviceMemory();
    const cpuCores = this.getCPUCores();
    
    let deviceClass: 'low' | 'medium' | 'high';
    if (memory >= 4096 && cpuCores >= 8) {
      deviceClass = 'high';
    } else if (memory >= 2048 && cpuCores >= 4) {
      deviceClass = 'medium';
    } else {
      deviceClass = 'low';
    }

    const profiles: Record<string, OptimizationProfile> = {
      low: {
        deviceClass: 'low',
        resolutionScale: 0.5,
        textureQuality: 'low',
        shadowQuality: 'low',
        particleCount: 100,
        drawDistance: 50,
        lodBias: 2.0,
        antiAliasing: false,
        postProcessing: false
      },
      medium: {
        deviceClass: 'medium',
        resolutionScale: 0.75,
        textureQuality: 'medium',
        shadowQuality: 'medium',
        particleCount: 500,
        drawDistance: 100,
        lodBias: 1.0,
        antiAliasing: true,
        postProcessing: false
      },
      high: {
        deviceClass: 'high',
        resolutionScale: 1.0,
        textureQuality: 'high',
        shadowQuality: 'high',
        particleCount: 2000,
        drawDistance: 200,
        lodBias: 0.5,
        antiAliasing: true,
        postProcessing: true
      }
    };

    return profiles[deviceClass];
  }

  /**
   * Create default performance metrics
   */
  private createDefaultMetrics(): PerformanceMetrics {
    return {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      batteryLevel: 100,
      thermalState: 'normal',
      networkQuality: 'good',
      cpuUsage: 0,
      gpuUsage: 0
    };
  }

  /**
   * Get device memory (approximate)
   */
  private getDeviceMemory(): number {
    if ('deviceMemory' in navigator) {
      return (navigator as any).deviceMemory * 1024; // Convert GB to MB
    }
    return 2048; // Default assumption
  }

  /**
   * Get CPU core count
   */
  private getCPUCores(): number {
    if ('hardwareConcurrency' in navigator) {
      return navigator.hardwareConcurrency;
    }
    return 4; // Default assumption
  }

  /**
   * Initialize mobile platform
   */
  async initialize(): Promise<void> {
    try {
      // Initialize touch input
      this.initializeTouchInput();
      
      // Initialize mobile features
      await this.initializeMobileFeatures();
      
      // Apply optimization profile
      this.applyOptimizationProfile();
      
      // Initialize performance monitoring
      this.initializePerformanceMonitoring();
      
      console.log(`Mobile platform initialized: ${this.platform} ${this.deviceType}`);
    } catch (error) {
      console.error('Failed to initialize mobile platform:', error);
      throw error;
    }
  }

  /**
   * Initialize touch input system
   */
  private initializeTouchInput(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    document.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
  }

  /**
   * Handle touch start events
   */
  private handleTouchStart(event: globalThis.TouchEvent): void {
    // Implementation for touch start handling
  }

  /**
   * Handle touch move events
   */
  private handleTouchMove(event: globalThis.TouchEvent): void {
    // Implementation for touch move handling
  }

  /**
   * Handle touch end events
   */
  private handleTouchEnd(event: globalThis.TouchEvent): void {
    // Implementation for touch end handling
  }

  /**
   * Handle touch cancel events
   */
  private handleTouchCancel(event: globalThis.TouchEvent): void {
    // Implementation for touch cancel handling
  }

  /**
   * Initialize mobile features
   */
  private async initializeMobileFeatures(): Promise<void> {
    // Initialize vibration
    if (this.features.vibration.enabled) {
      await this.initializeVibration();
    }

    // Initialize notifications
    if (this.features.notifications.enabled) {
      await this.initializeNotifications();
    }

    // Initialize sensors
    await this.initializeSensors();
  }

  /**
   * Initialize vibration system
   */
  private async initializeVibration(): Promise<void> {
    if ('vibrate' in navigator) {
      // Test vibration capability
      navigator.vibrate(10);
    }
  }

  /**
   * Initialize notification system
   */
  private async initializeNotifications(): Promise<void> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.features.notifications.permissions = permission === 'granted';
    }
  }

  /**
   * Initialize sensor systems
   */
  private async initializeSensors(): Promise<void> {
    // Initialize accelerometer
    if (this.features.accelerometer.enabled && 'Accelerometer' in window) {
      try {
        const accelerometer = new (window as any).Accelerometer({ frequency: this.features.accelerometer.frequency });
        // Start sensor monitoring
      } catch (error) {
        console.warn('Accelerometer not available:', error);
      }
    }

    // Initialize gyroscope
    if (this.features.gyroscope.enabled && 'Gyroscope' in window) {
      try {
        const gyroscope = new (window as any).Gyroscope({ frequency: this.features.gyroscope.frequency });
        // Start sensor monitoring
      } catch (error) {
        console.warn('Gyroscope not available:', error);
      }
    }
  }

  /**
   * Apply optimization profile
   */
  private applyOptimizationProfile(): void {
    // Apply resolution scaling
    if (this.optimizationProfile.resolutionScale !== 1.0) {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const scale = this.optimizationProfile.resolutionScale;
        canvas.style.transform = `scale(${scale})`;
        canvas.style.transformOrigin = 'center';
      }
    }

    // Apply other optimizations
    this.applyTextureQuality();
    this.applyShadowQuality();
    this.applyParticleLimits();
  }

  /**
   * Apply texture quality settings
   */
  private applyTextureQuality(): void {
    // Implementation for texture quality adjustment
  }

  /**
   * Apply shadow quality settings
   */
  private applyShadowQuality(): void {
    // Implementation for shadow quality adjustment
  }

  /**
   * Apply particle limits
   */
  private applyParticleLimits(): void {
    // Implementation for particle limit adjustment
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Start FPS monitoring
    this.startFPSMonitoring();
    
    // Start memory monitoring
    this.startMemoryMonitoring();
    
    // Start battery monitoring
    this.startBatteryMonitoring();
  }

  /**
   * Start FPS monitoring
   */
  private startFPSMonitoring(): void {
    let lastTime = performance.now();
    let frameCount = 0;

    const measureFPS = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      frameCount++;
      
      if (deltaTime >= 1000) {
        this.performanceMetrics.fps = Math.round((frameCount * 1000) / deltaTime);
        this.performanceMetrics.frameTime = deltaTime / frameCount;
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.performanceMetrics.memoryUsage = memory.usedJSHeapSize;
    }
  }

  /**
   * Start battery monitoring
   */
  private startBatteryMonitoring(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.performanceMetrics.batteryLevel = battery.level * 100;
        
        battery.addEventListener('levelchange', () => {
          this.performanceMetrics.batteryLevel = battery.level * 100;
        });
      });
    }
  }

  /**
   * Get current platform information
   */
  getPlatformInfo(): { platform: MobilePlatform; deviceType: DeviceType } {
    return {
      platform: this.platform,
      deviceType: this.deviceType
    };
  }

  /**
   * Get optimization profile
   */
  getOptimizationProfile(): OptimizationProfile {
    return this.optimizationProfile;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMetrics;
  }

  /**
   * Vibrate device
   */
  vibrate(pattern: number | number[]): void {
    if (this.features.vibration.enabled && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Show notification
   */
  async showNotification(title: string, body: string, icon?: string): Promise<void> {
    if (this.features.notifications.enabled && this.features.notifications.permissions) {
      new Notification(title, { body, icon });
    }
  }

  /**
   * Share content
   */
  async shareContent(title: string, text: string, url?: string): Promise<boolean> {
    if ('share' in navigator) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch (error) {
        console.warn('Share failed:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Request camera permission
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      this.features.camera.permissions = true;
      return true;
    } catch (error) {
      console.warn('Camera permission denied:', error);
      return false;
    }
  }

  /**
   * Request location permission
   */
  async requestLocationPermission(): Promise<boolean> {
    if ('geolocation' in navigator) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            this.features.gps.permissions = true;
            resolve(true);
          },
          () => {
            resolve(false);
          }
        );
      });
    }
    return false;
  }
}

// Factory function
export function createMobilePlatformSystem(): MobilePlatformSystem {
  return new MobilePlatformSystem();
}
