import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Unlock, Shield, Zap, Eye, FileText, ArrowRight, CheckCircle, Layers } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Shield,
    title: 'Secure Encryption',
    description: 'Military-grade AES-256 encryption to protect your sensitive documents.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Process multiple PDFs in seconds with our optimized engine.',
  },
  {
    icon: Eye,
    title: 'Privacy First',
    description: 'Your files are processed securely. We never store your documents.',
  },
  {
    icon: Layers,
    title: 'Merge PDFs',
    description: 'Combine multiple PDF files into a single document effortlessly.',
  },
];

const encryptSteps = [
  { step: '1', title: 'Upload', description: 'Drag & drop your PDF files' },
  { step: '2', title: 'Set Password', description: 'Enter a secure password' },
  { step: '3', title: 'Download', description: 'Get your protected files' },
];

const mergeSteps = [
  { step: '1', title: 'Upload', description: 'Add multiple PDF files' },
  { step: '2', title: 'Reorder', description: 'Arrange pages as needed' },
  { step: '3', title: 'Merge', description: 'Download combined PDF' },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Shield className="w-4 h-4" />
              Free & Secure Files Protection
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-tight mb-6"
            >
              Protect Your Files with{' '}
              <span className="text-gradient">Password Security</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            >
              Encrypt PDFs with strong passwords or unlock protected documents instantly. 
              100% free, no signup required. Your files never leave your device.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap"
            >
              <Link to="/encrypt">
                <Button size="lg" className="gap-2 gradient-primary text-primary-foreground shadow-glow px-8 h-14 text-lg">
                  <Lock className="w-5 h-5" />
                  Encrypt Files
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/convert">
                <Button size="lg" variant="outline" className="gap-2 px-8 h-14 text-lg">
                  <Convert className="w-5 h-5" />
                  Convert Files
                </Button>
              </Link> 
              <Link to="/merge">
                <Button size="lg" variant="outline" className="gap-2 px-8 h-14 text-lg">
                  <Layers className="w-5 h-5" />
                  Merge PDFs
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground"
            >
              {['No signup required', 'Up to 500MB per file', 'Batch processing'].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  {item}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Simple steps for all your PDF needs
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Encrypt Process */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 mb-8"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Encrypt Files</h3>
              </motion.div>
              <div className="space-y-6">
                {encryptSteps.map((item, index) => (
                  <motion.div
                    key={`encrypt-${item.step}`}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl gradient-primary text-primary-foreground text-lg font-bold flex items-center justify-center shadow-glow">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Merge Process */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 mb-8"
              >
                <div className="p-2 rounded-lg bg-accent/10">
                  <Layers className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Merge PDFs</h3>
              </motion.div>
              <div className="space-y-6">
                {mergeSteps.map((item, index) => (
                  <motion.div
                    key={`merge-${item.step}`}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent text-accent-foreground text-lg font-bold flex items-center justify-center">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose PDFProtect?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Powerful features designed with your security in mind
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center p-8 md:p-12 rounded-3xl glass"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Secure Your PDFs?
            </h2>
            <p className="text-muted-foreground mb-8">
              Start protecting your documents now. It's free and takes just seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              <Link to="/encrypt">
                <Button size="lg" className="gap-2 gradient-primary text-primary-foreground shadow-glow">
                  <Lock className="w-5 h-5" />
                  Encrypt PDF Now
                </Button>
              </Link>
              <Link to="/convert">
                <Button size="lg" variant="outline" className="gap-2">
                  <Convert className="w-5 h-5" />
                  Convert files
                </Button>
              </Link>
              <Link to="/merge">
                <Button size="lg" variant="outline" className="gap-2">
                  <Layers className="w-5 h-5" />
                  Merge PDFs
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
