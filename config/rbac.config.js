/**
 * Role based Access Control Config
 * @export {AccessControl}
 * @version 0.0.1
 */

import { AccessControl } from 'accesscontrol';

const grants = {
	guest: {
		"review": {
			"read:any": ["*"],
		},
	},
	regular: {
		"review": {
			"read:any": ["*"],
			"create:own": ["content", "rating", "imagesUri"],
			"update:own": ["content", "rating", "imagesUri"],
			"update:any": ['upVote', 'downVote'],
			"delete:own": ['*'],
		},
	},
	manager: {
		"review": {
			"read:any": ["*"],
			"create:own": ["content", "rating", "imagesUri"],
			"update:own": ["content", "rating", "imagesUri"],
			"update:any": ['upVote', 'downVote', 'status'],
			"delete:own": ['*'],
		},
	},
	admin: {
		"review": {
			"read:any": ["*"],
			"create:own": ["content", "rating", "imagesUri"],
			"update:own": ["content", "rating", "imagesUri"],
			"update:any": ['upVote', 'downVote', 'status'],
			"delete:own": ['*'],
		},
	},
	god: {
		"review": {
			"read:any": ["*"],
			"create:own": ["content", "rating", "imagesUri"],
			"update:own": ["content", "rating", "imagesUri"],
			"update:any": ['upVote', 'downVote', 'status'],
			"delete:own": ['*'],
		},
	}
};

const ac = new AccessControl(grants);

ac.lock();

export default ac;
