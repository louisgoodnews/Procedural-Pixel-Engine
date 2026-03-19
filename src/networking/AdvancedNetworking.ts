/**
 * Advanced Networking System
 * Provides comprehensive networking protocols and real-time multiplayer support
 */

import { createEngineError, validators } from '../utils/ErrorHandling';

export interface NetworkProtocol {
  name: string;
  type: 'tcp' | 'udp' | 'websocket' | 'http' | 'https' | 'webrtc' | 'quic';
  version: string;
  port?: number;
  secure: boolean;
  reliable: boolean;
  ordered: boolean;
  congestionControl: boolean;
  features: ProtocolFeature[];
  performance: ProtocolPerformance;
}

export interface ProtocolFeature {
  name: string;
  supported: boolean;
  description: string;
}

export interface ProtocolPerformance {
  latency: number; // ms
  bandwidth: number; // Mbps
  packetLoss: number; // percentage
  jitter: number; // ms
  overhead: number; // bytes per packet
}

export interface NetworkConnection {
  id: string;
  protocol: NetworkProtocol;
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  state: 'connecting' | 'connected' | 'disconnected' | 'error';
  established: Date;
  lastActivity: Date;
  metrics: ConnectionMetrics;
  configuration: ConnectionConfiguration;
}

export interface ConnectionMetrics {
  bytesSent: number;
  bytesReceived: number;
  packetsSent: number;
  packetsReceived: number;
  packetsLost: number;
  latency: number;
  jitter: number;
  bandwidth: number;
  errorCount: number;
  reconnectCount: number;
}

export interface ConnectionConfiguration {
  timeout: number; // ms
  keepAlive: boolean;
  keepAliveInterval: number; // ms
  maxRetries: number;
  retryDelay: number; // ms
  compression: boolean;
  encryption: boolean;
  bufferSize: number; // bytes
  priority: 'low' | 'normal' | 'high';
}

export interface NetworkMessage {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  sender: string;
  recipient?: string;
  channel?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  reliable: boolean;
  ordered: boolean;
  compressed: boolean;
  encrypted: boolean;
  size: number;
}

export interface NetworkChannel {
  id: string;
  name: string;
  type: 'unicast' | 'multicast' | 'broadcast';
  members: string[];
  maxMembers: number;
  reliable: boolean;
  ordered: boolean;
  encryption: boolean;
  created: Date;
  lastActivity: Date;
}

export interface NetworkEvent {
  type: 'connected' | 'disconnected' | 'message_received' | 'message_sent' | 'error' | 'metrics_update';
  connectionId: string;
  timestamp: Date;
  data?: any;
}

export interface NetworkStatistics {
  totalConnections: number;
  activeConnections: number;
  totalMessages: number;
  messagesPerSecond: number;
  totalBytes: number;
  bytesPerSecond: number;
  averageLatency: number;
  packetLossRate: number;
  errorRate: number;
  uptime: number;
}

export interface NetworkTopology {
  type: 'client_server' | 'peer_to_peer' | 'hybrid' | 'mesh' | 'star' | 'ring';
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  routing: RoutingTable;
}

export interface NetworkNode {
  id: string;
  address: string;
  port: number;
  type: 'client' | 'server' | 'peer' | 'relay';
  capacity: number;
  load: number;
  available: boolean;
  latency: number;
  bandwidth: number;
  lastSeen: Date;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  latency: number;
  bandwidth: number;
  reliable: boolean;
}

export interface RoutingTable {
  entries: RoutingEntry[];
  algorithm: 'shortest_path' | 'least_congestion' | 'load_balanced' | 'custom';
  lastUpdated: Date;
}

export interface RoutingEntry {
  destination: string;
  nextHop: string;
  cost: number;
  path: string[];
  expires: Date;
}

export interface LoadBalancer {
  id: string;
  algorithm: 'round_robin' | 'weighted' | 'least_connections' | 'least_response_time' | 'hash' | 'custom';
  nodes: LoadBalancedNode[];
  healthChecks: HealthCheck[];
  configuration: LoadBalancerConfiguration;
}

export interface LoadBalancedNode {
  id: string;
  address: string;
  port: number;
  weight: number;
  connections: number;
  capacity: number;
  healthy: boolean;
  responseTime: number;
  lastHealthCheck: Date;
}

export interface HealthCheck {
  type: 'tcp' | 'http' | 'https' | 'custom';
  interval: number; // ms
  timeout: number; // ms
  retries: number;
  healthyThreshold: number;
  unhealthyThreshold: number;
  path?: string;
  expectedStatus?: number;
}

export interface LoadBalancerConfiguration {
  stickySessions: boolean;
  sessionAffinity: string;
  failover: boolean;
  healthCheckInterval: number;
  maxRetries: number;
  timeout: number;
}

export interface NetworkOptimization {
  compression: CompressionSettings;
  encryption: EncryptionSettings;
  caching: CachingSettings;
  batching: BatchingSettings;
  prioritization: PrioritizationSettings;
}

export interface CompressionSettings {
  enabled: boolean;
  algorithm: 'gzip' | 'deflate' | 'brotli' | 'lz4' | 'custom';
  level: number; // 1-9
  threshold: number; // bytes
  excludeTypes: string[];
}

export interface EncryptionSettings {
  enabled: boolean;
  algorithm: 'aes-256-gcm' | 'chacha20-poly1305' | 'custom';
  keyRotation: boolean;
  keyRotationInterval: number; // hours
  handshakeTimeout: number; // ms
}

export interface CachingSettings {
  enabled: boolean;
  maxSize: number; // bytes
  ttl: number; // ms
  strategy: 'lru' | 'lfu' | 'fifo' | 'custom';
  compression: boolean;
}

export interface BatchingSettings {
  enabled: boolean;
  maxBatchSize: number;
  maxWaitTime: number; // ms
  aggregation: boolean;
  deduplication: boolean;
}

export interface PrioritizationSettings {
  enabled: boolean;
  queues: PriorityQueue[];
  congestionControl: boolean;
  flowControl: boolean;
}

export interface PriorityQueue {
  name: string;
  priority: number;
  maxSize: number;
  dropPolicy: 'tail' | 'head' | 'random';
  processing: 'fifo' | 'priority' | 'weighted';
}

export class AdvancedNetworkingSystem {
  private protocols = new Map<string, NetworkProtocol>();
  private connections = new Map<string, NetworkConnection>();
  private channels = new Map<string, NetworkChannel>();
  private topology: NetworkTopology;
  private loadBalancers = new Map<string, LoadBalancer>();
  private optimization: NetworkOptimization;
  private statistics = new Map<string, NetworkStatistics>();
  private eventListeners = new Map<string, Set<(event: NetworkEvent) => void>>();
  private messageHandlers = new Map<string, Set<(message: NetworkMessage) => void>>();

  constructor() {
    this.initializeProtocols();
    this.initializeTopology();
    this.initializeOptimization();
  }

  /**
   * Register a network protocol
   */
  registerProtocol(protocol: NetworkProtocol): void {
    validators.notNull(protocol);
    validators.notEmpty(protocol.name);

    this.protocols.set(protocol.name.toLowerCase(), protocol);
  }

  /**
   * Get supported protocols
   */
  getSupportedProtocols(): NetworkProtocol[] {
    return Array.from(this.protocols.values());
  }

  /**
   * Create network connection
   */
  async createConnection(
    protocolName: string,
    remoteAddress: string,
    remotePort: number,
    configuration: Partial<ConnectionConfiguration> = {}
  ): Promise<NetworkConnection> {
    const protocol = this.protocols.get(protocolName.toLowerCase());
    if (!protocol) {
      throw createEngineError(
        `Protocol '${protocolName}' not supported`,
        'PROTOCOL_NOT_SUPPORTED',
        'system',
        'high'
      );
    }

    const connectionId = this.generateId();
    const connection: NetworkConnection = {
      id: connectionId,
      protocol,
      localAddress: '0.0.0.0',
      localPort: 0,
      remoteAddress,
      remotePort,
      state: 'connecting',
      established: new Date(),
      lastActivity: new Date(),
      metrics: {
        bytesSent: 0,
        bytesReceived: 0,
        packetsSent: 0,
        packetsReceived: 0,
        packetsLost: 0,
        latency: 0,
        jitter: 0,
        bandwidth: 0,
        errorCount: 0,
        reconnectCount: 0
      },
      configuration: {
        timeout: 30000,
        keepAlive: true,
        keepAliveInterval: 30000,
        maxRetries: 3,
        retryDelay: 1000,
        compression: false,
        encryption: false,
        bufferSize: 65536,
        priority: 'normal',
        ...configuration
      }
    };

    try {
      await this.establishConnection(connection);
      
      connection.state = 'connected';
      this.connections.set(connectionId, connection);

      this.emitEvent({
        type: 'connected',
        connectionId,
        timestamp: new Date(),
        data: { protocol: protocol.name, remoteAddress, remotePort }
      });

      return connection;
    } catch (error) {
      connection.state = 'error';
      throw createEngineError(
        `Failed to create connection: ${error}`,
        'CONNECTION_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Close network connection
   */
  async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw createEngineError(
        `Connection '${connectionId}' not found`,
        'CONNECTION_NOT_FOUND',
        'system',
        'medium'
      );
    }

    try {
      await this.terminateConnection(connection);
      
      connection.state = 'disconnected';
      this.connections.delete(connectionId);

      this.emitEvent({
        type: 'disconnected',
        connectionId,
        timestamp: new Date()
      });
    } catch (error) {
      throw createEngineError(
        `Failed to close connection: ${error}`,
        'CONNECTION_CLOSE_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Send network message
   */
  async sendMessage(
    connectionId: string,
    type: string,
    data: any,
    options: {
      recipient?: string;
      channel?: string;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      reliable?: boolean;
      ordered?: boolean;
    } = {}
  ): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw createEngineError(
        `Connection '${connectionId}' not found`,
        'CONNECTION_NOT_FOUND',
        'system',
        'high'
      );
    }

    if (connection.state !== 'connected') {
      throw createEngineError(
        `Connection '${connectionId}' is not connected`,
        'CONNECTION_NOT_CONNECTED',
        'system',
        'high'
      );
    }

    const message: NetworkMessage = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now(),
      sender: 'local',
      recipient: options.recipient,
      channel: options.channel,
      priority: options.priority || 'normal',
      reliable: options.reliable ?? true,
      ordered: options.ordered ?? true,
      compressed: this.optimization.compression.enabled,
      encrypted: this.optimization.encryption.enabled,
      size: this.calculateMessageSize(data)
    };

    try {
      await this.transmitMessage(connection, message);
      
      connection.metrics.bytesSent += message.size;
      connection.metrics.packetsSent++;
      connection.lastActivity = new Date();

      this.emitEvent({
        type: 'message_sent',
        connectionId,
        timestamp: new Date(),
        data: { messageId: message.id, type, size: message.size }
      });
    } catch (error) {
      connection.metrics.errorCount++;
      throw createEngineError(
        `Failed to send message: ${error}`,
        'MESSAGE_SEND_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Create network channel
   */
  createChannel(
    name: string,
    type: 'unicast' | 'multicast' | 'broadcast',
    options: {
      maxMembers?: number;
      reliable?: boolean;
      ordered?: boolean;
      encryption?: boolean;
    } = {}
  ): NetworkChannel {
    const channelId = this.generateId();
    const channel: NetworkChannel = {
      id: channelId,
      name,
      type,
      members: [],
      maxMembers: options.maxMembers || 100,
      reliable: options.reliable ?? true,
      ordered: options.ordered ?? true,
      encryption: options.encryption ?? false,
      created: new Date(),
      lastActivity: new Date()
    };

    this.channels.set(channelId, channel);
    return channel;
  }

  /**
   * Join network channel
   */
  async joinChannel(channelId: string, connectionId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    const connection = this.connections.get(connectionId);

    if (!channel) {
      throw createEngineError(
        `Channel '${channelId}' not found`,
        'CHANNEL_NOT_FOUND',
        'system',
        'medium'
      );
    }

    if (!connection) {
      throw createEngineError(
        `Connection '${connectionId}' not found`,
        'CONNECTION_NOT_FOUND',
        'system',
        'medium'
      );
    }

    if (channel.members.length >= channel.maxMembers) {
      throw createEngineError(
        `Channel '${channelId}' is full`,
        'CHANNEL_FULL',
        'system',
        'medium'
      );
    }

    channel.members.push(connectionId);
    channel.lastActivity = new Date();
  }

  /**
   * Leave network channel
   */
  async leaveChannel(channelId: string, connectionId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    const index = channel.members.indexOf(connectionId);
    if (index !== -1) {
      channel.members.splice(index, 1);
      channel.lastActivity = new Date();
    }
  }

  /**
   * Create load balancer
   */
  createLoadBalancer(
    algorithm: LoadBalancer['algorithm'],
    nodes: LoadBalancedNode[],
    configuration: Partial<LoadBalancerConfiguration> = {}
  ): LoadBalancer {
    const loadBalancerId = this.generateId();
    const loadBalancer: LoadBalancer = {
      id: loadBalancerId,
      algorithm,
      nodes: [...nodes],
      healthChecks: [],
      configuration: {
        stickySessions: false,
        sessionAffinity: '',
        failover: true,
        healthCheckInterval: 30000,
        maxRetries: 3,
        timeout: 5000,
        ...configuration
      }
    };

    this.loadBalancers.set(loadBalancerId, loadBalancer);
    return loadBalancer;
  }

  /**
   * Get connection from load balancer
   */
  getConnectionFromBalancer(
    loadBalancerId: string,
    clientAddress?: string
  ): LoadBalancedNode | null {
    const loadBalancer = this.loadBalancers.get(loadBalancerId);
    if (!loadBalancer) {
      throw createEngineError(
        `Load balancer '${loadBalancerId}' not found`,
        'LOAD_BALANCER_NOT_FOUND',
        'system',
        'high'
      );
    }

    const healthyNodes = loadBalancer.nodes.filter(node => node.healthy);
    if (healthyNodes.length === 0) {
      return null;
    }

    switch (loadBalancer.algorithm) {
      case 'round_robin':
        return this.roundRobinSelection(healthyNodes);
      case 'weighted':
        return this.weightedSelection(healthyNodes);
      case 'least_connections':
        return this.leastConnectionsSelection(healthyNodes);
      case 'least_response_time':
        return this.leastResponseTimeSelection(healthyNodes);
      case 'hash':
        return this.hashSelection(healthyNodes, clientAddress);
      default:
        return healthyNodes[0];
    }
  }

  /**
   * Get network statistics
   */
  getStatistics(connectionId?: string): NetworkStatistics {
    let connections = Array.from(this.connections.values());

    if (connectionId) {
      connections = connections.filter(conn => conn.id === connectionId);
    }

    const activeConnections = connections.filter(conn => conn.state === 'connected');
    const totalMessages = connections.reduce((sum, conn) => sum + conn.metrics.packetsSent + conn.metrics.packetsReceived, 0);
    const totalBytes = connections.reduce((sum, conn) => sum + conn.metrics.bytesSent + conn.metrics.bytesReceived, 0);
    const averageLatency = activeConnections.length > 0 
      ? activeConnections.reduce((sum, conn) => sum + conn.metrics.latency, 0) / activeConnections.length 
      : 0;
    const packetLossRate = connections.reduce((sum, conn) => sum + conn.metrics.packetsLost, 0) / 
      Math.max(1, connections.reduce((sum, conn) => sum + conn.metrics.packetsSent, 0));

    return {
      totalConnections: connections.length,
      activeConnections: activeConnections.length,
      totalMessages,
      messagesPerSecond: totalMessages / 60, // Rough estimate
      totalBytes,
      bytesPerSecond: totalBytes / 60, // Rough estimate
      averageLatency,
      packetLossRate,
      errorRate: connections.reduce((sum, conn) => sum + conn.metrics.errorCount, 0) / Math.max(1, totalMessages),
      uptime: Date.now() - (connections[0]?.established.getTime() || Date.now())
    };
  }

  /**
   * Add event listener
   */
  addEventListener(
    eventType: string,
    callback: (event: NetworkEvent) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType)!.add(callback);
    
    return () => {
      this.eventListeners.get(eventType)?.delete(callback);
    };
  }

  /**
   * Add message handler
   */
  addMessageHandler(
    messageType: string,
    handler: (message: NetworkMessage) => void
  ): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }
    
    this.messageHandlers.get(messageType)!.add(handler);
    
    return () => {
      this.messageHandlers.get(messageType)?.delete(handler);
    };
  }

  // Private methods

  private initializeProtocols(): void {
    // TCP
    this.registerProtocol({
      name: 'tcp',
      type: 'tcp',
      version: '1.0',
      secure: false,
      reliable: true,
      ordered: true,
      congestionControl: true,
      features: [
        { name: 'reliable_delivery', supported: true, description: 'Guaranteed message delivery' },
        { name: 'ordered_delivery', supported: true, description: 'Messages delivered in order' },
        { name: 'flow_control', supported: true, description: 'Prevents sender overflow' },
        { name: 'congestion_control', supported: true, description: 'Adapts to network conditions' }
      ],
      performance: {
        latency: 50,
        bandwidth: 1000,
        packetLoss: 0.1,
        jitter: 5,
        overhead: 40
      }
    });

    // UDP
    this.registerProtocol({
      name: 'udp',
      type: 'udp',
      version: '1.0',
      secure: false,
      reliable: false,
      ordered: false,
      congestionControl: false,
      features: [
        { name: 'low_latency', supported: true, description: 'Minimal transmission delay' },
        { name: 'connectionless', supported: true, description: 'No connection overhead' },
        { name: 'multicast', supported: true, description: 'One-to-many communication' }
      ],
      performance: {
        latency: 10,
        bandwidth: 1000,
        packetLoss: 2.0,
        jitter: 2,
        overhead: 8
      }
    });

    // WebSocket
    this.registerProtocol({
      name: 'websocket',
      type: 'websocket',
      version: '13',
      secure: false,
      reliable: true,
      ordered: true,
      congestionControl: true,
      features: [
        { name: 'full_duplex', supported: true, description: 'Simultaneous two-way communication' },
        { name: 'low_overhead', supported: true, description: 'Minimal framing overhead' },
        { name: 'binary_support', supported: true, description: 'Binary message support' }
      ],
      performance: {
        latency: 30,
        bandwidth: 500,
        packetLoss: 0.5,
        jitter: 3,
        overhead: 14
      }
    });

    // WebRTC
    this.registerProtocol({
      name: 'webrtc',
      type: 'webrtc',
      version: '1.0',
      secure: true,
      reliable: false,
      ordered: false,
      congestionControl: true,
      features: [
        { name: 'p2p_communication', supported: true, description: 'Peer-to-peer communication' },
        { name: 'nat_traversal', supported: true, description: 'NAT traversal support' },
        { name: 'media_streams', supported: true, description: 'Audio/video streaming' }
      ],
      performance: {
        latency: 20,
        bandwidth: 1000,
        packetLoss: 1.0,
        jitter: 10,
        overhead: 20
      }
    });
  }

  private initializeTopology(): void {
    this.topology = {
      type: 'client_server',
      nodes: [],
      edges: [],
      routing: {
        entries: [],
        algorithm: 'shortest_path',
        lastUpdated: new Date()
      }
    };
  }

  private initializeOptimization(): void {
    this.optimization = {
      compression: {
        enabled: true,
        algorithm: 'gzip',
        level: 6,
        threshold: 1024,
        excludeTypes: ['binary', 'compressed']
      },
      encryption: {
        enabled: false,
        algorithm: 'aes-256-gcm',
        keyRotation: true,
        keyRotationInterval: 24,
        handshakeTimeout: 5000
      },
      caching: {
        enabled: true,
        maxSize: 1048576, // 1MB
        ttl: 300000, // 5 minutes
        strategy: 'lru',
        compression: true
      },
      batching: {
        enabled: true,
        maxBatchSize: 100,
        maxWaitTime: 10,
        aggregation: true,
        deduplication: true
      },
      prioritization: {
        enabled: true,
        queues: [
          { name: 'critical', priority: 100, maxSize: 100, dropPolicy: 'tail', processing: 'priority' },
          { name: 'high', priority: 75, maxSize: 500, dropPolicy: 'tail', processing: 'priority' },
          { name: 'normal', priority: 50, maxSize: 1000, dropPolicy: 'tail', processing: 'fifo' },
          { name: 'low', priority: 25, maxSize: 500, dropPolicy: 'head', processing: 'fifo' }
        ],
        congestionControl: true,
        flowControl: true
      }
    };
  }

  private async establishConnection(connection: NetworkConnection): Promise<void> {
    // In a real implementation, would establish actual network connection
    console.log(`Establishing ${connection.protocol.name} connection to ${connection.remoteAddress}:${connection.remotePort}`);
    
    // Simulate connection establishment
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async terminateConnection(connection: NetworkConnection): Promise<void> {
    // In a real implementation, would terminate actual network connection
    console.log(`Terminating connection to ${connection.remoteAddress}:${connection.remotePort}`);
    
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private async transmitMessage(connection: NetworkConnection, message: NetworkMessage): Promise<void> {
    // In a real implementation, would transmit actual network message
    console.log(`Transmitting message ${message.id} via ${connection.protocol.name}`);
    
    // Simulate transmission
    await new Promise(resolve => setTimeout(resolve, 1));
  }

  private calculateMessageSize(data: any): number {
    return JSON.stringify(data).length * 2; // Rough estimate
  }

  private roundRobinSelection(nodes: LoadBalancedNode[]): LoadBalancedNode {
    const index = Math.floor(Math.random() * nodes.length);
    return nodes[index];
  }

  private weightedSelection(nodes: LoadBalancedNode[]): LoadBalancedNode {
    const totalWeight = nodes.reduce((sum, node) => sum + node.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const node of nodes) {
      random -= node.weight;
      if (random <= 0) {
        return node;
      }
    }
    
    return nodes[0];
  }

  private leastConnectionsSelection(nodes: LoadBalancedNode[]): LoadBalancedNode {
    return nodes.reduce((min, node) => 
      node.connections < min.connections ? node : min
    );
  }

  private leastResponseTimeSelection(nodes: LoadBalancedNode[]): LoadBalancedNode {
    return nodes.reduce((min, node) => 
      node.responseTime < min.responseTime ? node : min
    );
  }

  private hashSelection(nodes: LoadBalancedNode[], clientAddress?: string): LoadBalancedNode {
    const hash = this.calculateHash(clientAddress || '');
    const index = hash % nodes.length;
    return nodes[index];
  }

  private calculateHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private emitEvent(event: NetworkEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const callback of listeners) {
        callback(event);
      }
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Factory function
export function createAdvancedNetworkingSystem(): AdvancedNetworkingSystem {
  return new AdvancedNetworkingSystem();
}
