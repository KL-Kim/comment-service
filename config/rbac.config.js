/**
 * Role based Access Control Config
 * @export {AccessControl}
 * @version 0.0.1
 */
const grants = {
	guest: {
		"review": {
			"read:any": ["*"],
		},
	},
	regular: {
		"review": {
			"read:any": ["*", "!status", "!quality"],
			"create:own": ["content", "rating", "imagesUri", "serviceGood", "envGood", "comeback"],
			"update:own": ["content", "rating", "imagesUri", "serviceGood", "envGood", "comeback"],
			"update:any": ['vote'],
			"delete:own": ['*'],
		},
	},
	manager: {
		"review": {
			"read:any": ["*"],
			"create:own": ["content", "rating", "imagesUri", "serviceGood", "envGood", "comeback"],
			"update:own": ["content", "rating", "imagesUri", "serviceGood", "envGood", "comeback"],
			"update:any": ['vote', 'status', 'quality'],
			"delete:own": ['*'],
		},
	},
	admin: {
		"review": {
			"read:any": ["*"],
			"create:own": ["content", "rating", "imagesUri", "serviceGood", "envGood", "comeback"],
			"update:own": ["content", "rating", "imagesUri", "serviceGood", "envGood", "comeback"],
			"update:any": ['vote', 'status', 'quality'],
			"delete:own": ['*'],
		},
	},
	god: {
		"review": {
			"read:any": ["*"],
			"create:own": ["content", "rating", "imagesUri", "serviceGood", "envGood", "comeback"],
			"update:own": ["content", "rating", "imagesUri", "serviceGood", "envGood", "comeback"],
			"update:any": ['vote', 'status', 'quality'],
			"delete:own": ['*'],
		},
	}
};

export default grants;
