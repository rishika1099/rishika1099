# Encrypted content backups

`portfolio-backup.json.enc` is a weekly snapshot of everything the site keeps in
Netlify Blobs, which is otherwise the only copy: page copy, poems (full text),
About and education entries, contact links, rich blog posts, photo captions,
reactions, the guestbook, project overrides, and the LaTeX résumé source.

It is encrypted because this repository is public and the poems are gated.

## Restoring

```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -in backups/portfolio-backup.json.enc \
  -out backup.json
```

You will be asked for `BACKUP_PASSPHRASE`. **Keep that passphrase in your
password manager**, not only in GitHub secrets: without it this file is
unrecoverable, which is rather the point.

Each snapshot carries a `counts` census (poems, copy blocks, photos, projects,
résumé length), which you can read once you have decrypted it.

`.content-sha256` beside it fingerprints that content, with the timestamp left
out, and decides whether a week's backup is committed at all. The encrypted file
cannot answer that question: openssl salts at random, so identical content
encrypts differently every time. A hash rather than the content itself, because
this repository is public.

## Not included

The photo and poem-art **image files**. They are large and either re-uploadable
from the originals or regenerable. The writing is what cannot be recreated, and
that is covered in full.
