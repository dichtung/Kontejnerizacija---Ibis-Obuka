conn = new Mongo();
//ako ne postoji, kreira bazu "zivotinje"
db = conn.getDB("zivotinje");
//Ukoliko vec postoji, brise kolekciju "macke"
db.macke.drop();
db.macke.insert({ name: 'Tom', type: 'Smotana macka', lives_left: 4 });
db.macke.insert({ name: 'Fifi', type: 'Gradska macka', lives_left: 7 });
db.macke.insert({ name: 'Cicko', type: 'Seoska macka', lives_left: 4 });
db.macke.insert({ name: 'Mjaukalo', type: 'Mlada macka', lives_left: 9 });
db.createUser(
{
    user: "ibis",
    pwd: "ibis123",
    roles: [
        {
            role: "readWrite",
            db: "zivotinje"
        }
    ]
}
);
