import { AppDataSource } from '../config/db';
import { User } from '../entities/User';

interface UserEventData {
  eventType: string;
  eventId?: string;
  timestamp: string;
  data: {
    userId: string | number;
    fullname: string;
    email: string;
    username: string;
    createdAt?: string;
    loginAt?: string;
  };
  metadata?: {
    service: string;
    version: string;
  };
}

export async function handleUserCreatedEvent(eventData: UserEventData): Promise<void> {
  try {
    const { userId, fullname, email, username, createdAt } = eventData.data;

    console.log('🎯 Processing USER_CREATED event for:', email);

    const userRepository = AppDataSource.getRepository(User);

    // Check if user already exists
    let user = await userRepository.findOne({ where: { email } });

    if (!user) {
      user = userRepository.create({
        user_id: Number(userId),
        fullname,
        email,
        username,
        phone: null,
        is_active: 1,
      });

      await userRepository.save(user);
      console.log('✅ User subscription created successfully:', email);

      // TODO: Add additional actions
      // await sendWelcomeEmail(email, fullname);
      // await createDefaultRole(userId);
    } else {
      console.log('ℹ️ User already exists in subscription service:', email);
    }
  } catch (error) {
    console.error('❌ Error handling USER_CREATED event:', error);
    throw error;
  }
}

export async function handleUserLoginEvent(eventData: UserEventData): Promise<void> {
  try {
    const { userId, email, loginAt } = eventData.data;
    
    console.log('🎯 Processing USER_LOGIN event for:', email);
    
    // Add your login tracking logic here
    
    console.log('✅ User login tracked successfully:', email);
  } catch (error) {
    console.error('❌ Error handling USER_LOGIN event:', error);
    throw error;
  }
}

export async function handleUserUpdatedEvent(eventData: UserEventData): Promise<void> {
  try {
    const { userId, email, fullname, username } = eventData.data;
    
    console.log('🎯 Processing USER_UPDATED event for:', email);
    
    const userRepository = AppDataSource.getRepository(User);
    
    await userRepository.update(
      { email },
      { 
        fullname,
        username,
      }
    );
    
    console.log('✅ User update processed successfully:', email);
  } catch (error) {
    console.error('❌ Error handling USER_UPDATED event:', error);
    throw error;
  }
}

// Main event router
export async function handleUserEvent(
  event: UserEventData,
  topic: string,
  partition: number
): Promise<void> {
  console.log('=== RECEIVED EVENT ===');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Topic:', topic);
  console.log('Partition:', partition);
  
  const { eventType } = event;

  console.log(`📨 Routing event: ${eventType} | Topic: ${topic} | Partition: ${partition}`);

  try {
    switch (eventType) {
      case 'USER_CREATED':
        await handleUserCreatedEvent(event);
        break;
      
      case 'USER_LOGIN':
        await handleUserLoginEvent(event);
        break;
      
      case 'USER_UPDATED':
        await handleUserUpdatedEvent(event);
        break;
      
      default:
        console.warn(`⚠️ Unknown event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${eventType} event:`, error);
  }
}
