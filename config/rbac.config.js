/**
 * Role based Access Control Config
 * @export {AccessControl}
 * @version 0.0.1
 */
const grants = {
	guest: {
		"review": {
			"read:any": ["*", "!status", "!quality"],
		},
		"comment": {
			"read:any": ["*", "!status",],
		},
	},
	regular: {
		"review": {
			"read:any": ["*", "!status", "!quality"],
			"create:own": ["content", "rating", "imagesUri", "serviceGood", "envGood", "comeback"],
			"update:own": ["content", "rating", "imagesUri", "serviceGood", "envGood", "comeback"],
			"update:any": ['upvote'],
			"delete:own": ['*'],
		},
		"comment": {
			"read:any": ["*", "!status", "!quality"],
			"create:own": ["content"],
			"update:own": ["content"],
			"update:any": ['upvote', 'downvote'],
			"delete:own": ['*'],
		},
	},
	manager: {
		"review": {
			"read:any": ["*"],
			"create:own": ["content", "rating", "imagesUri", "serviceGood", "envGood", "comeback"],
			"update:own": ["content", "rating", "imagesUri", "serviceGood", "envGood", "comeback"],
			"update:any": ['upvote', 'status', 'quality'],
			"delete:own": ['*'],
		},
		"comment": {
			"read:any": ["*"],
			"create:own": ["content"],
			"update:own": ["content"],
			"update:any": ['upvote', 'downvote','status'],
			"delete:own": ['*'],
		},
	},
	admin: {
		"review": {
			"read:any": ["*"],
			"create:own": ["content", "rating", "imagesUri", "serviceGood", "envGood", "comeback"],
			"update:own": ["content", "rating", "imagesUri", "serviceGood", "envGood", "comeback"],
			"update:any": ['upvote', 'status', 'quality'],
			"delete:own": ['*'],
		},
		"comment": {
			"read:any": ["*"],
			"create:own": ["content"],
			"update:own": ["content"],
			"update:any": ['upvote', 'downvote', 'status'],
			"delete:own": ['*'],
		},
	},
	god: {
		"review": {
			"read:any": ["*"],
			"create:own": ["content", "rating", "imagesUri", "serviceGood", "envGood", "comeback"],
			"update:own": ["content", "rating", "imagesUri", "serviceGood", "envGood", "comeback"],
			"update:any": ['upvote', 'status', 'quality'],
			"delete:own": ['*'],
		},
		"comment": {
			"read:any": ["*"],
			"create:own": ["content"],
			"update:own": ["content"],
			"update:any": ['vote', 'downvote', 'status'],
			"delete:own": ['*'],
		},
	}
};

export default grants;
