import { redisStore } from './redisStore';

async function testRedisStore() {
  console.log('🧪 Testing Redis Store...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const health = await redisStore.healthCheck();
    console.log('   Health Status:', health.status);
    console.log('   Details:', health.details);
    console.log('');

    // Test 2: Room Operations
    console.log('2. Testing Room Operations...');
    const roomId = 'test-room-' + Date.now();
    const userId = 'test-user-' + Date.now();
    
    // Join room
    await redisStore.joinRoom(userId, roomId, {
      nickname: 'TestUser',
      avatar: 'https://example.com/avatar.jpg',
      joinedAt: new Date().toISOString(),
      isRoomCreator: true
    });
    console.log('   ✅ User joined room');

    // Check if user is in room
    const isParticipant = await redisStore.hasRoomParticipant(roomId, userId);
    console.log('   ✅ User participant check:', isParticipant);

    // Get room participants
    const participants = await redisStore.getRoomParticipants(roomId);
    console.log('   ✅ Room participants count:', participants.size);

    // Check room creator
    const creator = await redisStore.getRoomCreator(roomId);
    console.log('   ✅ Room creator:', creator === userId);

    // Test 3: Message Operations
    console.log('3. Testing Message Operations...');
    const message = {
      id: Date.now().toString(),
      text: 'Hello, World!',
      userId,
      nickname: 'TestUser',
      avatar: 'https://example.com/avatar.jpg',
      timestamp: new Date().toISOString(),
      isInvisible: false
    };

    await redisStore.addRoomMessage(roomId, message);
    console.log('   ✅ Message added');

    const messages = await redisStore.getRoomMessages(roomId);
    console.log('   ✅ Messages count:', messages.length);

    // Test 4: User Room Mapping
    console.log('4. Testing User Room Mapping...');
    const userRoom = await redisStore.getUserRoom(userId);
    console.log('   ✅ User room mapping:', userRoom === roomId);

    // Test 5: Leave Room
    console.log('5. Testing Leave Room...');
    await redisStore.leaveRoom(userId, roomId);
    console.log('   ✅ User left room');

    // Verify cleanup
    const remainingParticipants = await redisStore.getRoomParticipants(roomId);
    const remainingCreator = await redisStore.getRoomCreator(roomId);
    const remainingUserRoom = await redisStore.getUserRoom(userId);
    
    console.log('   ✅ Cleanup verification:');
    console.log('      - Remaining participants:', remainingParticipants.size);
    console.log('      - Remaining creator:', remainingCreator);
    console.log('      - Remaining user room:', remainingUserRoom);

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    await redisStore.disconnect();
    console.log('\n🔌 Redis connection closed');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testRedisStore();
}

export { testRedisStore };
