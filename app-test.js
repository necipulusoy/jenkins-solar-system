let mongoose = require("mongoose");
let server = require("./app");
let chai = require("chai");
let chaiHttp = require("chai-http");

chai.should();
chai.use(chaiHttp);

describe('Planets API Suite', () => {

    describe('Fetching Planet Details', () => {

        it('should fetch Mercury', async () => {
            const res = await chai.request(server)
                .post('/planet')
                .send({ id: 1 });

            res.should.have.status(200);
            res.body.should.have.property('id').eql(1);
            res.body.should.have.property('name').eql('Mercury');
        });

        it('should fetch Venus', async () => {
            const res = await chai.request(server)
                .post('/planet')
                .send({ id: 2 });

            res.should.have.status(200);
            res.body.should.have.property('id').eql(2);
            res.body.should.have.property('name').eql('Venus');
        });

        it('should fetch Earth', async () => {
            const res = await chai.request(server)
                .post('/planet')
                .send({ id: 3 });

            res.should.have.status(200);
            res.body.should.have.property('id').eql(3);
            res.body.should.have.property('name').eql('Earth');
        });

        it('should fetch Mars', async () => {
            const res = await chai.request(server)
                .post('/planet')
                .send({ id: 4 });

            res.should.have.status(200);
            res.body.should.have.property('id').eql(4);
            res.body.should.have.property('name').eql('Mars');
        });

        it('should fetch Jupiter', async () => {
            const res = await chai.request(server)
                .post('/planet')
                .send({ id: 5 });

            res.should.have.status(200);
            res.body.should.have.property('id').eql(5);
            res.body.should.have.property('name').eql('Jupiter');
        });

        it('should fetch Saturn', async () => {
            const res = await chai.request(server)
                .post('/planet')
                .send({ id: 6 });

            res.should.have.status(200);
            res.body.should.have.property('id').eql(6);
            res.body.should.have.property('name').eql('Saturn');
        });

        it('should fetch Uranus', async () => {
            const res = await chai.request(server)
                .post('/planet')
                .send({ id: 7 });

            res.should.have.status(200);
            res.body.should.have.property('id').eql(7);
            res.body.should.have.property('name').eql('Uranus');
        });

        it('should fetch Neptune', async () => {
            const res = await chai.request(server)
                .post('/planet')
                .send({ id: 8 });

            res.should.have.status(200);
            res.body.should.have.property('id').eql(8);
            res.body.should.have.property('name').eql('Neptune');
        });

    });

});

describe('Testing Other Endpoints', () => {

    it('should fetch OS details', async () => {
        const res = await chai.request(server).get('/os');
        res.should.have.status(200);
    });

    it('should fetch live status', async () => {
        const res = await chai.request(server).get('/live');
        res.should.have.status(200);
        res.body.should.have.property('status').eql('live');
    });

    it('should fetch ready status', async () => {
        const res = await chai.request(server).get('/ready');
        res.should.have.status(200);
        res.body.should.have.property('status').eql('ready');
    });

});

after(async () => {
    // TESTLER BİTİNCE MONGOOSE BAĞLANTISINI KAPAT
    await mongoose.connection.close();
});
