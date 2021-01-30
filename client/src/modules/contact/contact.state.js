import { atom } from 'recoil';

export default atom({
    key: 'contact',
    default: {
        name: '',
        email: '',
        subject: '',
        body: '',
        errors: {},
    }
});
