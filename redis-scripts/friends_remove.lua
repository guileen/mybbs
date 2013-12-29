-- keys: 2
local id, fanId = KEYS[1], KEYS[2]
redis.call('ZREM', 'player:'..fanId..':followings', id)
redis.call('ZREM', 'player:'..fanId..':friends', id)
redis.call('ZREM', 'player:'..id..':fans', fanId)
redis.call('ZREM', 'player:'..id..':friends', fanId)
