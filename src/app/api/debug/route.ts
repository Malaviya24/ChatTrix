import { NextResponse } from 'next/server';
import { roomStorage } from '@/lib/roomStorage';

export async function GET() {
  try {
    const allRooms = roomStorage.getAllRooms();
    const activeRooms = allRooms.filter(room => room.isActive);
    const expiredRooms = allRooms.filter(room => !room.isActive);
    
    const now = new Date();
    
    const debugInfo = {
      timestamp: now.toISOString(),
      totalRooms: allRooms.length,
      activeRooms: activeRooms.length,
      expiredRooms: expiredRooms.length,
      globalStorageExists: !!global.__roomStorage,
      globalStorageSize: global.__roomStorage ? global.__roomStorage.size : 0,
      rooms: allRooms.map(room => ({
        id: room.id,
        name: room.name,
        isActive: room.isActive,
        createdAt: room.createdAt.toISOString(),
        expiresAt: room.expiresAt.toISOString(),
        isExpired: now > room.expiresAt,
        participants: room.participants?.length || 0,
        maxUsers: room.maxUsers
      }))
    };
    
    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Debug endpoint failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
