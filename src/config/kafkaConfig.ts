import { Kafka, Consumer, logLevel } from 'kafkajs';

class KafkaConfig {
  private kafka: Kafka;
  private consumer: Consumer | null;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'subscription-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      logLevel: logLevel.INFO,
      retry: {
        initialRetryTime: 300,
        retries: 10
      },
      connectionTimeout: 30000,
      requestTimeout: 30000,
    });

    this.consumer = null;
  }

  async getConsumer(groupId: string = 'subscription-group'): Promise<Consumer> {
    if (!this.consumer) {
      this.consumer = this.kafka.consumer({
        groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        retry: {
          initialRetryTime: 100,
          retries: 8
        }
      });

      await this.consumer.connect();
      console.log('✅ Kafka Consumer connected successfully');
    }
    return this.consumer;
  }

  async subscribe(topics: string[]): Promise<void> {
    if (!this.consumer) {
      await this.getConsumer();
    }

    await this.consumer!.subscribe({
      topics: topics,
      fromBeginning: true  // Set to true to consume old messages
    });

    console.log(`✅ Subscribed to topics: ${topics.join(', ')}`);
  }

  async startConsuming(
    messageHandler: (event: any, topic: string, partition: number) => Promise<void>
  ): Promise<void> {
    if (!this.consumer) {
      throw new Error('Consumer not initialized. Call getConsumer() first.');
    }

    await this.consumer.run({
      autoCommit: false, 
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const messageValue = message.value?.toString();
          
          if (!messageValue) {
            console.warn('⚠️ Received empty message');
            return;
          }

          const parsedMessage = JSON.parse(messageValue);
          
          console.log('📥 Received message:', {
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
            eventType: parsedMessage.eventType
          });

          await messageHandler(parsedMessage, topic, partition);

        } catch (error) {
          console.error('❌ Error processing message:', error);
        }
      }
    });

    console.log('✅ Consumer is running and listening for messages...');
  }

  async disconnect(): Promise<void> {
    if (this.consumer) {
      await this.consumer.disconnect();
      console.log('❌ Kafka Consumer disconnected');
      this.consumer = null;
    }
  }
}

export default new KafkaConfig();
